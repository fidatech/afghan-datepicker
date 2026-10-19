import 'package:flutter/material.dart';
import 'afghan_datepicker.dart';

void main() => runApp(const MaterialApp(home: AfghanDemo()));

class AfghanDemo extends StatefulWidget {
  const AfghanDemo({super.key});
  @override
  State<AfghanDemo> createState() => _AfghanDemoState();
}

class _AfghanDemoState extends State<AfghanDemo> {
  DateTime? selected;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Afghan Datepicker')),
      body: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        AfghanDatepickerField(
          value: selected, locale: 'ps-AF',
          onChanged: (result) => setState(() => selected = result),
        ),
        const SizedBox(height: 14),
        Text(selected == null ? 'No date selected' : isoDate(selected!)),
      ])),
    );
  }
}
