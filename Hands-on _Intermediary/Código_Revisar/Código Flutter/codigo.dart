import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Para usar FilteringTextInputFormatter

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: RegistrationScreen(),
      debugShowCheckedModeBanner: false, // Remove a faixa de debug
      routes: {
        '/notification': (context) => NotificationScreen(), // Rota para a nova tela
      },
    );
  }
}

class RegistrationScreen extends StatelessWidget {
  // Controladores para capturar os valores dos campos
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _codeController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: Color(0xFFD4EDF4), // Cor de fundo #d4edf4
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              Image.asset(
                'assets/babysafe_logo.png',
                width: 200,
                height: 200,
              ),
              SizedBox(height: 40),
              Text(
                'REGISTRO',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(height: 20),
              // Campo de Nome estilizado como botão
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40.0),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(25), // Bordas arredondadas
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.2),
                        spreadRadius: 2,
                        blurRadius: 5,
                        offset: Offset(0, 3), // Sombra suave
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _nameController,
                    textAlign: TextAlign.center, // Centraliza o texto
                    decoration: InputDecoration(
                      hintText: 'NOME', // Texto de dica centralizado
                      hintStyle: TextStyle(color: Colors.grey[600], fontSize: 16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(25),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: EdgeInsets.symmetric(vertical: 15, horizontal: 20),
                    ),
                    style: TextStyle(fontSize: 16, color: Colors.black),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z\s]')), // Apenas letras e espaços
                    ],
                    keyboardType: TextInputType.text, // Teclado de texto
                  ),
                ),
              ),
              SizedBox(height: 20),
              // Campo de Código estilizado como botão
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40.0),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(25), // Bordas arredondadas
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.2),
                        spreadRadius: 2,
                        blurRadius: 5,
                        offset: Offset(0, 3), // Sombra suave
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _codeController,
                    textAlign: TextAlign.center, // Centraliza o texto
                    decoration: InputDecoration(
                      hintText: 'CÓDIGO', // Texto de dica centralizado
                      hintStyle: TextStyle(color: Colors.grey[600], fontSize: 16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(25),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: EdgeInsets.symmetric(vertical: 15, horizontal: 20),
                    ),
                    style: TextStyle(fontSize: 16, color: Colors.black),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9]')), // Apenas números
                    ],
                    keyboardType: TextInputType.number, // Teclado numérico
                  ),
                ),
              ),
              SizedBox(height: 20),
              // Botão para navegar
              ElevatedButton(
                onPressed: () {
                  if (_nameController.text.isNotEmpty && _codeController.text.isNotEmpty) {
                    Navigator.pushNamed(context, '/notification');
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Por favor, preencha Nome e Código!')),
                    );
                  }
                },
                child: Text('Próximo'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal[700],
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Classe para gerenciar o estado do interruptor
class NotificationScreen extends StatefulWidget {
  @override
  _NotificationScreenState createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  bool _isNotificationEnabled = true; // Estado inicial do interruptor (verde)

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: Color(0xFFD4EDF4), // Fundo azul claro
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              Image.asset(
                'assets/babysafe_logo.png', // Certifique-se de que o asset está configurado
                width: 150,
                height: 150,
              ),
              SizedBox(height: 40),
              // Texto "NOTIFICAÇÕES"
              Text(
                'NOTIFICAÇÕES',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(height: 40),
              // Interruptor
              Transform.scale(
                scale: 2.0, // Aumenta o tamanho do interruptor
                child: Switch(
                  value: _isNotificationEnabled,
                  onChanged: (value) {
                    setState(() {
                      _isNotificationEnabled = value; // Atualiza o estado
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Notificações ${value ? 'ativadas' : 'desativadas'}')),
                    );
                  },
                  activeColor: Colors.green,
                  activeTrackColor: Colors.green[200],
                  inactiveThumbColor: Colors.red,
                  inactiveTrackColor: Colors.red[200],
                ),
              ),
              SizedBox(height: 40),
              // Botão de voltar
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: Text('Voltar'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal[700],
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
