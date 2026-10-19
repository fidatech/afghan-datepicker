import 'package:flutter/material.dart';
import 'package:shamsi_date/shamsi_date.dart';

String isoDate(DateTime date) =>
    date.year.toString().padLeft(4, '0') + '-' +
    date.month.toString().padLeft(2, '0') + '-' +
    date.day.toString().padLeft(2, '0');

const monthNames = <String, List<String>>{
  'ps-AF': ['وری','غویی','غبرګولی','چنګاښ','زمری','وږی','تله','لړم','لیندۍ','مرغومی','سلواغه','کب'],
  'fa-AF': ['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'],
  'fa-IR': ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'],
  'en': ['Hamal','Sawr','Jawza','Saratan','Asad','Sonbola','Mizan','Aqrab','Qaws','Jadi','Dalw','Hut'],
};
const weekdayNames = <String, List<String>>{
  'ps-AF': ['خالي','یونۍ','دونۍ','درېنۍ','څلورنۍ','پنځنۍ','جمعه'],
  'fa-AF': ['شنبه','یکشنبه','دوشنبه','سه شنبه','چهارشنبه','پنج شنبه','جمعه'],
  'fa-IR': ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'],
  'en': ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'],
};

String localDigits(int number, String locale) {
  final value = number.toString();
  if (locale == 'en') return value;
  const ascii = '0123456789';
  const digits = '۰۱۲۳۴۵۶۷۸۹';
  return value.split('').map((character) {
    final offset = ascii.indexOf(character);
    return offset < 0 ? character : digits[offset];
  }).join();
}

class AfghanDatepickerField extends StatelessWidget {
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;
  final String locale;
  const AfghanDatepickerField({
    super.key, required this.value, required this.onChanged, this.locale = 'ps-AF'
  });

  @override
  Widget build(BuildContext context) {
    final selectedLocale = monthNames.containsKey(locale) ? locale : 'ps-AF';
    final selected = value == null ? null : Jalali.fromDateTime(value!);
    final title = selected == null ? 'Choose date' :
      localDigits(selected.day, selectedLocale) + ' ' +
      monthNames[selectedLocale]![selected.month - 1] + ' ' +
      localDigits(selected.year, selectedLocale);
    return OutlinedButton.icon(
      icon: const Icon(Icons.calendar_month),
      label: Text(title),
      onPressed: () async {
        final result = await showModalBottomSheet<DateTime>(
          context: context,
          showDragHandle: true,
          isScrollControlled: true,
          builder: (_) => _CalendarSheet(selected: value, locale: selectedLocale),
        );
        if (result != null) onChanged(result);
      },
    );
  }
}

class _CalendarSheet extends StatefulWidget {
  final DateTime? selected;
  final String locale;
  const _CalendarSheet({required this.selected, required this.locale});
  @override
  State<_CalendarSheet> createState() => _CalendarSheetState();
}

class _CalendarSheetState extends State<_CalendarSheet> {
  late int year;
  late int month;
  late int yearPage;
  String view = 'days';

  @override
  void initState() {
    super.initState();
    final current = Jalali.fromDateTime(widget.selected ?? DateTime.now());
    year = current.year;
    month = current.month;
    yearPage = (year ~/ 12) * 12;
  }

  void move(int amount) {
    try {
      setState(() {
        if (view == 'years') {
          yearPage += amount * 12;
        } else if (view == 'months') {
          year += amount;
        } else {
          final other = Jalali(year, month, 1).addMonths(amount);
          year = other.year;
          month = other.month;
        }
      });
    } catch (_) {
      // Underlying package bounds prevent navigation to unsupported years.
    }
  }

  @override
  Widget build(BuildContext context) {
    final rtl = widget.locale != 'en';
    final months = monthNames[widget.locale]!;
    final grid = <Widget>[];
    if (view == 'days') {
      final first = Jalali(year, month, 1);
      for (var blank = 1; blank < first.weekDay; blank++) {
        grid.add(const SizedBox.shrink());
      }
      for (var day = 1; day <= first.monthLength; day++) {
        final date = Jalali(year, month, day).toDateTime();
        final isCurrent = widget.selected != null &&
            isoDate(widget.selected!) == isoDate(date);
        grid.add(InkWell(
          onTap: () => Navigator.pop(context, date),
          child: Container(
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isCurrent ? const Color(0xFF102B3F) : null,
              borderRadius: BorderRadius.circular(7),
            ),
            child: Text(localDigits(day, widget.locale), style: TextStyle(
              color: isCurrent ? Colors.white : const Color(0xFF102B3F)
            )),
          ),
        ));
      }
    } else if (view == 'months') {
      for (var m = 1; m <= 12; m++) {
        final choice = m;
        grid.add(TextButton(onPressed: () => setState(() {
          month = choice;
          view = 'days';
        }), child: Text(months[m - 1])));
      }
    } else {
      for (var y = yearPage; y < yearPage + 12; y++) {
        final choice = y;
        grid.add(TextButton(onPressed: () => setState(() {
          year = choice;
          view = 'months';
        }), child: Text(localDigits(choice, widget.locale))));
      }
    }

    return SafeArea(child: Center(child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 440),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 8, 14, 26),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            IconButton(icon: const Icon(Icons.chevron_left), onPressed: () => move(-1)),
            TextButton(onPressed: () => setState(() => view = 'months'),
              child: Text(months[month - 1])),
            TextButton(onPressed: () => setState(() {
              yearPage = (year ~/ 12) * 12;
              view = 'years';
            }), child: Text(localDigits(year, widget.locale))),
            IconButton(icon: const Icon(Icons.chevron_right), onPressed: () => move(1)),
          ]),
          if (view == 'days') Directionality(
            textDirection: rtl ? TextDirection.rtl : TextDirection.ltr,
            child: Row(children: [
              for (final name in weekdayNames[widget.locale]!)
                Expanded(child: Text(name, textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 10))),
            ]),
          ),
          const SizedBox(height: 8),
          Directionality(
            textDirection: rtl ? TextDirection.rtl : TextDirection.ltr,
            child: GridView.count(
              crossAxisCount: view == 'days' ? 7 : 3,
              childAspectRatio: view == 'days' ? 1.15 : 2.3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: grid,
            ),
          ),
          TextButton(onPressed: () => Navigator.pop(context),
            child: const Text('Close')),
        ]),
      ),
    )));
  }
}
