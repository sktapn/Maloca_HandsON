# Sistema de Monitoramento de Dispenser com ESP32, Sensor PIR, Ultrassônico e Buzzer

**Descrição:** Neste tutorial, criaremos um sistema de monitoramento simples para um dispenser (por exemplo, de álcool em gel). Ao detectar movimento por meio de um sensor PIR e medir a distância usando um sensor ultrassônico, o sistema aciona um buzzer quando uma pessoa se aproxima. O objetivo é criar um alerta sonoro para indicar quando o dispenser está sendo acessado. Este projeto é voltado para entusiastas de IoT, estudantes e makers interessados em automação simples e monitoração local.

---

## Índice

1. [Introdução](#introdução)  
2. [Requisitos](#requisitos)  
3. [Configuração do Ambiente](#configuração-do-ambiente)  
4. [Montagem do Circuito](#montagem-do-circuito)  
5. [Programação](#programação)  
6. [Teste e Validação](#teste-e-validação)  
7. [Expansões e Melhorias](#expansões-e-melhorias)  
8. [Referências](#referências)  

---

## Introdução

Este projeto tem como finalidade monitorar a presença de pessoas próximas a um dispenser, como o de álcool em gel, utilizando um conjunto de sensores e um ESP32. Ao detectar movimento com o sensor PIR, o sistema mede a distância pelo sensor ultrassônico e, se a pessoa estiver muito próxima, emite um alerta sonoro através de um buzzer. Assim, pode ser empregado em ambientes de uso comum, alertando sobre a presença próxima do dispenser e incentivando a higienização das mãos.

A integração com o ambiente IoT pode ser realizada posteriormente, permitindo, por exemplo, enviar dados sobre a frequência de uso para um servidor ou aplicação web. Mas neste tutorial básico, focaremos na montagem local e no funcionamento autônomo do sistema.

---

## Requisitos

### Hardware

- **Placa:** ESP32 
- **Sensores:**
  - Sensor PIR (ex: HC-SR501) para detecção de movimento.
  - Sensor Ultrassônico (HC-SR04) para medição de distância.
- **Atuadores:**
  - Buzzer piezoelétrico para alerta sonoro.
- **Outros componentes:**
  - Botão (push-button) para ativar/desativar o sistema.
  - Jumpers, Protoboard (opcional) e resistores.

### Software

- **Linguagem:** C/C++ (utilizando a Arduino IDE ou PlatformIO)
- **IDE:** Arduino IDE (com suporte ao ESP32)
- **Bibliotecas:**  
  - Biblioteca padrão do Arduino para `pulseIn()` e I/O digital.

*(Não é necessária nenhuma biblioteca externa adicional para este projeto.)*

---

## Configuração do Ambiente

### Passo 1: Instalação da IDE

- **Arduino IDE:**  
1. Arduino IDE: Faça o download e instale o [Arduino IDE](https://www.arduino.cc/en/software) acessando o site https://www.arduino.cc/en/software.
   
![imagem  alt](https://github.com/sktapn/maloca-turma-ufrr-2023_Abrah-o/blob/Tutorial-2/tutoriais/Sistema%20de%20Monitoramento%20de%20IMC%20com%20Sensores%20de%20Peso%20e%20Altura/download%20arduino.png?raw=true)
    
### Passo 2: Configuração das Placas
- **Configuração no Arduino:**
1. Conecte a placa ESP32 via USB ao computador.
2. Na Arduino IDE:
3. Vá em **Ferramentas > Placa > ESP32 Arduino > (Selecione o modelo da sua placa ESP32)**.
4. Selecione a porta correta em **Ferramentas > Porta**.
     
![imagem alt](https://github.com/sktapn/maloca-turma-ufrr-2023_Abrah-o/blob/Tutorial-2/tutoriais/Sistema%20de%20Monitoramento%20de%20IMC%20com%20Sensores%20de%20Peso%20e%20Altura/arduino.png?raw=true)
---

## Montagem do Circuito

Abaixo, um guia de conexões típicas:

- **Sensor PIR (HC-SR501):**
  - VCC → 5V do ESP32
  - GND → GND do ESP32
  - OUT → GPIO 23 do ESP32

- **Sensor Ultrassônico (HC-SR04):**
  - VCC → 5V do ESP32
  - GND → GND do ESP32
  - TRIG → GPIO 13 do ESP32
  - ECHO → GPIO 12 do ESP32  
  *(Se necessário, use um divisor de tensão no ECHO, pois o ESP32 é 3.3V tolerant.)*

- **Buzzer:**
  - Terminal positivo → GPIO 5 do ESP32
  - Terminal negativo → GND do ESP32

- **Botão (com pull-up interno):**
  - Um terminal do botão → GPIO 22 do ESP32
  - Outro terminal do botão → GND do ESP32
    
## Circuito
![imagem alt](https://github.com/user-attachments/assets/4ff49cd7-91c5-47d1-b0c7-4cae4b49d954) 
---

## Programação

### Definições, Declarações e Setup

```cpp
#include <Arduino.h>

// ==================== Definições de Pinos e Parâmetros ====================
const int PIN_BUZZER     = 5;    // Buzzer
const int PIN_PIR        = 23;   // Sensor PIR
const int PIN_BUTTON     = 22;   // Botão para ativar/desativar
const int TRIGGER_PIN    = 13;   // TRIG do Ultrassônico
const int ECHO_PIN       = 12;   // ECHO do Ultrassônico

const float DISTANCIA_LIMITE     = 20.0;   // Distância limite (cm)
const unsigned long TEMPO_ESPERA = 500;     // Intervalo entre leituras (ms)
const unsigned long TEMPO_DEBOUNCE = 300;   // Debounce botão (ms)
const float VELOCIDADE_SOM_CM_US = 0.0343;  // Velocidade do som (cm/µs)

// ==================== Variáveis Globais ====================
volatile bool botaoPressionado = false;    
long duration = 0;                         
float distancia = 0.0;                     
unsigned long ultimoTempo = 0;             
unsigned long ultimoBotao = 0;             
bool simuladorAtivo = false;               

// ==================== Máquina de Estados ====================
enum Estado {
  DESATIVADO,
  MONITORANDO
};

Estado estadoAtual = DESATIVADO;

// ==================== Prototipação de Funções ====================
void IRAM_ATTR handleBotaoPressionado();
void atualizarEstado();
void verificarMovimento();
void medirDistancia();
void ligarBuzzer(long duracao);
void desligarBuzzer();

// ==================== Função de Interrupção ====================
void IRAM_ATTR handleBotaoPressionado() {
  unsigned long agora = millis();
  if (agora - ultimoBotao > TEMPO_DEBOUNCE) {
    botaoPressionado = true;
    ultimoBotao = agora;
  }
}

// ==================== Setup ====================
void setup() {
  Serial.begin(115200);

  pinMode(PIN_BUZZER, OUTPUT);    
  pinMode(PIN_PIR, INPUT);        
  pinMode(PIN_BUTTON, INPUT_PULLUP);     
  pinMode(TRIGGER_PIN, OUTPUT);   
  pinMode(ECHO_PIN, INPUT);

  desligarBuzzer();
  attachInterrupt(digitalPinToInterrupt(PIN_BUTTON), handleBotaoPressionado, FALLING);

  Serial.println("Sistema de Monitoramento de Dispenser Iniciado");
  Serial.println("Pressione o botão para iniciar/parar o simulador");
}
```
### Loop Principal e Funções Auxiliares
```cpp
void loop() {
  atualizarEstado();

  switch (estadoAtual) {
    case DESATIVADO:
      desligarBuzzer();
      break;

    case MONITORANDO:
      if (millis() - ultimoTempo >= TEMPO_ESPERA) {
        ultimoTempo = millis();
        verificarMovimento();
      }
      break;
  }
}

void atualizarEstado() {
  if (botaoPressionado) {
    botaoPressionado = false;
    simuladorAtivo = !simuladorAtivo;

    if (simuladorAtivo) {
      estadoAtual = MONITORANDO;
      Serial.println("Simulador Ativado!");
    } else {
      estadoAtual = DESATIVADO;
      Serial.println("Simulador Desativado!");
      desligarBuzzer();
    }
  }
}

void verificarMovimento() {
  int estadoPIR = digitalRead(PIN_PIR);

  if (estadoPIR == HIGH) {
    Serial.println("Sensor PIR: Movimento detectado!");
    medirDistancia();
  } else {
    Serial.println("Sensor PIR: Nenhum movimento detectado.");
    desligarBuzzer();
  }
}

void medirDistancia() {
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);

  delayMicroseconds(5);

  duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration != 0) {
    distancia = (duration * VELOCIDADE_SOM_CM_US) / 2.0;
    Serial.print("Distância calculada (cm): ");
    Serial.println(distancia, 1);

    if (distancia > 0.0 && distancia <= DISTANCIA_LIMITE) {
      Serial.print("Pessoa detectada próxima ao dispenser! Distância: ");
      Serial.print(distancia, 1);
      Serial.println(" cm");
      ligarBuzzer(100);
    } else if (distancia > DISTANCIA_LIMITE && distancia <= 500.0) {
      Serial.print("Nada próximo. Distância: ");
      Serial.print(distancia, 1);
      Serial.println(" cm");
      desligarBuzzer();
    } else {
      Serial.println("Sensor Ultrassônico: Leitura inválida.");
      desligarBuzzer();
    }
  } else {
    Serial.println("Sensor Ultrassônico: Nenhuma resposta do sensor.");
    desligarBuzzer();
  }
}

void ligarBuzzer(long duracao) {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(duracao);
  digitalWrite(PIN_BUZZER, LOW);
}

void desligarBuzzer() {
  digitalWrite(PIN_BUZZER, LOW);
}
```
## Teste e Validação

- **Testando o PIR:**  
  Movimente-se em frente ao sensor PIR e verifique no **Serial Monitor** se a mensagem “**Movimento detectado!**” é exibida.

- **Testando o Ultrassônico:**  
  Coloque a mão a aproximadamente **10-20 cm** do sensor ultrassônico e observe se o buzzer é acionado, indicando a detecção de proximidade.

- **Testando o Botão:**  
  Pressione o botão para **ativar** ou **desativar** o sistema. No **Serial Monitor**, devem aparecer as mensagens “**Simulador Ativado!**” ou “**Simulador Desativado!**” correspondentes.

Certifique-se de que o dispositivo esteja em um ambiente adequado, sem interferências, e com o sensor ultrassônico bem posicionado para garantir leituras confiáveis.

## Expansões e Melhorias

- **Conectividade IoT:**  
  Utilize o **Wi-Fi do ESP32** para enviar dados sobre quantas vezes o dispenser foi acionado para um servidor ou dashboard online, permitindo análise em tempo real.

- **Display ou LEDs:**  
  Adicione um **display LCD** ou **LEDs** para indicar o estado do sistema ou a distância medida, facilitando a visualização das informações sem a necessidade de um monitor serial.

- **Ajuste de Sensibilidade:**  
  Modifique a **distância limite** hardcoded no código, ou implemente um **potenciômetro** para ajustar a sensibilidade dinamicamente, tornando o sistema mais flexível para diferentes ambientes.

## Referências

- [Documentação Oficial do Arduino](https://docs.arduino.cc/)  
  Recursos e referências para funções, bibliotecas e exemplos da plataforma Arduino.

- [Arduino Playground: Interrupções](https://playground.arduino.cc/Code/Interrupts/)  
  Informações sobre o uso de interrupções em Arduino (aplicável também ao ESP32).

- [Documentação da função pulseIn()](https://www.arduino.cc/reference/en/language/functions/time/pulsein/)  
  Referência para a função `pulseIn()`, utilizada na leitura do pulso do sensor ultrassônico.




