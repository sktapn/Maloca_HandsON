// Definir os pinos dos sensores ultrassônicos
const int trigPin1 = 5;      // Pino Trig do primeiro sensor ultrassônico
const int echoPin1 = 18;     // Pino Echo do primeiro sensor ultrassônico
const int trigPin4 = 22;     // Pino Trig do quarto sensor ultrassônico
const int echoPin4 = 23;     // Pino Echo do quarto sensor ultrassônico
const int ledPin = 12;       // Pino do LED

// Definir a distância mínima para acionar o LED (em cm)
const float distanciaMinima = 5.0;

void setup() {
  // Configurar o pino do LED como saída
  pinMode(ledPin, OUTPUT);

  // Configurar os pinos dos sensores ultrassônicos
  pinMode(trigPin1, OUTPUT);
  pinMode(echoPin1, INPUT);
  pinMode(trigPin4, OUTPUT);
  pinMode(echoPin4, INPUT);
  
  // Inicializar a comunicação serial (para receber dados do Arduino)
  Serial.begin(115200);  // A comunicação serial será em 115200 bauds
}

void loop() {
  // Verificar se há dados recebidos do Arduino via comunicação serial
  if (Serial.available()) {
    String comando = Serial.readStringUntil('\n'); // Ler até o fim da linha
    
    // Verificar qual PIR foi acionado e ligar o LED
    if (comando == "PIR1") {
      digitalWrite(ledPin, HIGH);
      Serial.println("LED ligado devido ao sensor PIR 1 detectar movimento!");
    } else if (comando == "PIR2") {
      digitalWrite(ledPin, HIGH);
      Serial.println("LED ligado devido ao sensor PIR 2 detectar movimento!");
    }
  }

  // Medir a distância com os sensores ultrassônicos
  float distancia1 = medirDistancia(trigPin1, echoPin1);
  float distancia4 = medirDistancia(trigPin4, echoPin4);

  // Verificar se a distância é menor que a mínima (acionando o LED se necessário)
  if (distancia4 < distanciaMinima || distancia1 < distanciaMinima) {
    // Ligar o LED se qualquer sensor ultrassônico detectar proximidade
    digitalWrite(ledPin, HIGH);
    if (distancia4 < distanciaMinima) {
      Serial.println("LED ligado devido ao sensor ultrassônico 4 detectar proximidade!");
    }
    if (distancia1 < distanciaMinima) {
      Serial.println("LED ligado devido ao sensor ultrassônico 1 detectar proximidade!");
    }
  } else {
    // Desligar o LED se não houver proximidade
    digitalWrite(ledPin, LOW);
    Serial.println("Nada detectado pelos sensores ultrassônicos");
  }

  // Aguardar 100 milissegundos antes de verificar novamente
  delay(100);
}

// Função para medir a distância com o sensor ultrassônico
float medirDistancia(int trigPin, int echoPin) {
  // Enviar um pulso de 10 microssegundos no pino Trig
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Ler o tempo de resposta no pino Echo
  long duracao = pulseIn(echoPin, HIGH);
  
  // Calcular a distância em centímetros
  float distancia = duracao * 0.034 / 2; // Fórmula: (tempo * velocidade do som) / 2
  
  return distancia;
}
