// Definindo os pinos
#define TRIG1_PIN 18      // Trig do Sensor Ultrassônico 1 (borda esquerda)
#define ECHO1_PIN 19      // Echo do Sensor Ultrassônico 1
#define TRIG2_PIN 21      // Trig do Sensor Ultrassônico 2 (borda direita)
#define ECHO2_PIN 22      // Echo do Sensor Ultrassônico 2
#define LED_PIN 4         // LED Vermelho

// Variáveis para armazenar os tempos dos sensores ultrassônicos
long duration1, duration2;
int distance1, distance2;

void setup() {
  // Inicializando os pinos como entrada ou saída
  pinMode(TRIG1_PIN, OUTPUT);
  pinMode(ECHO1_PIN, INPUT);
  pinMode(TRIG2_PIN, OUTPUT);
  pinMode(ECHO2_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  Serial.begin(115200);  // Inicializando a comunicação serial para monitoramento
}

void loop() {
  // Medir distância do Sensor Ultrassônico 1 (borda esquerda)
  distance1 = getDistance(TRIG1_PIN, ECHO1_PIN);
  
  // Medir distância do Sensor Ultrassônico 2 (borda direita)
  distance2 = getDistance(TRIG2_PIN, ECHO2_PIN);

  // Verificando se o bebê está muito perto de qualquer borda (distância < 20 cm)
  if (distance1 < 20 || distance2 < 20) {
    digitalWrite(LED_PIN, HIGH);  // Acende o LED se o bebê estiver muito perto da borda
    Serial.println("Bebê está muito perto das bordas!"); // Mensagem para monitoramento
  } else {
    digitalWrite(LED_PIN, LOW);   // Apaga o LED se a distância for segura
    Serial.println("Bebê está a uma distância segura."); // Mensagem para monitoramento
  }

  delay(500);  // Aguarda meio segundo antes de fazer uma nova leitura
}

// Função para calcular a distância com o sensor ultrassônico
int getDistance(int trigPin, int echoPin) {
  // Envia um pulso de 10 microssegundos no pino Trig
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Lê a duração do pulso no pino Echo
  duration1 = pulseIn(echoPin, HIGH);
  
  // Calcula a distância com base na velocidade do som (aproximadamente 343 m/s a 20°C)
  int distance = duration1 * 0.034 / 2;  // A divisão por 2 é porque o som vai e volta

  return distance;
}
