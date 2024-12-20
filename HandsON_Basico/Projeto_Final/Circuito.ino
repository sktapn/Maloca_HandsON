#include <LiquidCrystal.h>
#include <Servo.h>

// Pinos do LCD
const int rs = 12, en = 11, d4 = 5, d5 = 4, d6 = 3, d7 = 2;
LiquidCrystal lcd(rs, en, d4, d5, d6, d7);

// Pinos do Buzzer
const int buzzer = 7;

// Pinos dos Botões
const int botaoConfirmacao = 10;  // Botão de confirmação
const int botaoCancelar = 6;      // Botão de cancelamento

// Servo Motor
Servo servoMotor;
const int pinoServo = 13;

// Variáveis
bool medConfirmada = false;
unsigned long alarmeHorario;
unsigned long intervaloAlarme = 60000; // Tempo inicial de 1 minuto
unsigned long ultimoAtualizaMinutos = 0;
String nomeRemedio = "";
int tempoAlertas = 1; // Tempo inicial para os alertas (em minutos)
const String senhaCorreta = "1234";
bool sistemaAberto = false;

// Funções auxiliares para leitura do monitor serial
String lerSerial() {
    String input = "";
    while (Serial.available()) {
        char c = Serial.read();
        input += c;
        delay(10); // Espera por mais caracteres
    }
    input.trim(); // Remove espaços extras
    return input;
}

void setup() {
    Serial.begin(9600);

    // Inicializa o LCD
    lcd.begin(16, 2);
    lcd.setCursor(0, 0);
    lcd.print("Sistema Lembrete");
    delay(2000);
    lcd.clear();
    lcd.print("Digite a senha:");
    Serial.println("Digite a senha para acessar o sistema:");

    // Configuração de pinos
    pinMode(buzzer, OUTPUT);
    pinMode(botaoConfirmacao, INPUT_PULLUP); // Botão de confirmação
    pinMode(botaoCancelar, INPUT_PULLUP);    // Botão de cancelamento

    // Inicializa o servo
    servoMotor.attach(pinoServo);
    servoMotor.write(0); // Servo fechado

    // Aguarda a senha correta
    while (!sistemaAberto) {
        String senha = lerSerial();
        if (senha == senhaCorreta) {
            lcd.clear();
            lcd.print("Senha correta!");
            Serial.println("Senha correta! Sistema liberado.");
            abrirSistema();
            break;
        } else if (senha.length() > 0) {
            lcd.clear();
            lcd.print("Senha incorreta");
            Serial.println("Senha incorreta. Tente novamente:");
            delay(2000);
            lcd.clear();
            lcd.print("Digite a senha:");
        }
    }

    cadastrarRemedio();
    fecharSistema();
}

void loop() {
    // Verifica se o botão de confirmação foi pressionado
    if (digitalRead(botaoConfirmacao) == LOW) {
        confirmarMed();
    }

    // Verifica se o botão de cancelamento foi pressionado
    if (digitalRead(botaoCancelar) == LOW) {
        cancelarAlarme();  // Cancela o alarme e permite novo cadastro de remédio
    }

    // Atualiza os minutos restantes no LCD
    if (millis() - ultimoAtualizaMinutos >= 60000 && !medConfirmada) {
        ultimoAtualizaMinutos = millis();
        atualizarMinutosRestantes();
    }

    // Alarme ativo
    if (millis() >= alarmeHorario && !medConfirmada) {
        lcd.setCursor(0, 1);
        lcd.print("Alarme! Tome!");
        digitalWrite(buzzer, HIGH);
        servoMotor.write(90); // Gira o servo quando o buzzer toca
    } else {
        digitalWrite(buzzer, LOW);
    }
}

// Função chamada para confirmar que o remédio foi tomado
void confirmarMed() {
    medConfirmada = true;
    alarmeHorario = millis() + intervaloAlarme; // Alarme configurado com o mesmo intervalo

    // Mensagem no LCD
    lcd.clear();
    lcd.setCursor(0, 1);
    lcd.print("Medicado!");

    // Desliga o servo
    servoMotor.write(0); // Retorna o servo para a posição inicial

    medConfirmada = false;
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Sistema Lembrete");
}

// Função chamada para cancelar o alarme, eliminar o remédio e permitir novo cadastro
void cancelarAlarme() {
    // Reseta o alarme
    alarmeHorario = millis() + intervaloAlarme; // Resetando o alarme

    // Elimina o remédio atual
    nomeRemedio = ""; // Limpa o nome do remédio
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Remedio Cancelado");

    // Abre o servo para indicar cancelamento
    servoMotor.write(90); // Abre o servo para novo cadastro

    // Desliga o buzzer
    digitalWrite(buzzer, LOW);

    delay(2000); // Exibe a mensagem por 2 segundos

    // Inicia o cadastro de um novo remédio
    cadastrarRemedio();

    // Fecha o servo após concluir o cadastro
    servoMotor.write(0); // Retorna o servo para fechado
}

// Função para atualizar os minutos restantes
void atualizarMinutosRestantes() {
    unsigned long tempoRestante = alarmeHorario - millis();
    int minutosRestantes = tempoRestante / 60000;
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Restante:");
    lcd.print(minutosRestantes);
    lcd.print("m");
    lcd.setCursor(0, 1);
    lcd.print("Remedio: ");
    lcd.print(nomeRemedio);
}

void cadastrarRemedio() {
    lcd.clear();
    lcd.print("Digite nome:");
    Serial.println("Digite o nome do remédio:");

    // Limpa o buffer da Serial
    while (Serial.available()) {
        Serial.read();
    }

    // Aguarda a entrada de um nome válido
    while (true) {
        String entrada = lerSerial();
        if (entrada.length() > 0) {
            nomeRemedio = entrada;
            break; // Sai do loop ao receber uma entrada válida
        }
    }

    // Exibe o nome do remédio no LCD
    lcd.clear();
    lcd.print("Remedio:");
    lcd.setCursor(0, 1);
    lcd.print(nomeRemedio);
    delay(2000);

    // Configura o tempo para o alarme
    lcd.clear();
    lcd.print("Defina tempo (min):");
    Serial.println("Digite o tempo (em minutos) para o alarme:");
    while (true) {
        String tempoInput = lerSerial();
        if (tempoInput.length() > 0) {
            tempoAlertas = tempoInput.toInt();
            if (tempoAlertas > 0) break; // Sai do loop se o tempo for válido
        }
    }

    // Exibe o tempo de alarme no LCD
    lcd.clear();
    lcd.print("Tempo:");
    lcd.print(tempoAlertas);
    lcd.print(" min");
    intervaloAlarme = tempoAlertas * 60000; // Converte para milissegundos
    alarmeHorario = millis() + intervaloAlarme; // Configura o alarme
    Serial.println("Cadastro completo!");
}

void abrirSistema() {
    servoMotor.write(90); // Gira o servo para abrir
    sistemaAberto = true;
}

void fecharSistema() {
    servoMotor.write(0); // Retorna o servo para fechado
}