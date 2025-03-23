import 'package:flutter/material.dart';

// MODELO DE USUÁRIO
class User {
  final String name;
  final String email;
  final String password;

  User({
    required this.name,
    required this.email,
    required this.password,
  });
}

// GERENCIADOR DE USUÁRIOS
class UserManager {
  static final List<User> _users = [];

  static bool registerUser(String name, String email, String password) {
    if (_users.any((user) => user.email == email)) {
      return false;
    }
    _users.add(User(name: name, email: email, password: password));
    return true;
  }

  static bool loginUser(String email, String password) {
    return _users.any((user) => user.email == email && user.password == password);
  }
}

// EXTENSÃO PARA SNACKBAR
extension ContextExtensions on BuildContext {
  void showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}

// COMPONENTES VISUAIS
class PrimaryButton extends StatelessWidget {
  final String text;
  final IconData icon;
  final VoidCallback onPressed;

  const PrimaryButton({
    super.key,
    required this.text,
    required this.icon,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 20),
        label: Text(
          text,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF0277BD),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
      ),
    );
  }
}

class SecondaryButton extends StatelessWidget {
  final String text;
  final IconData icon;
  final VoidCallback onPressed;

  const SecondaryButton({
    super.key,
    required this.text,
    required this.icon,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 20),
        label: Text(
          text,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFF0277BD),
          side: const BorderSide(color: Color(0xFF0277BD), width: 1.5),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}
// HEALTH ICON (Decorativo)
class HealthIcon extends StatelessWidget {
  final IconData icon;
  final Color color;
  final Offset position;
  final double size;

  const HealthIcon({
    super.key,
    required this.icon,
    required this.color,
    required this.position,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: position.dx,
      top: position.dy,
      child: Icon(
        icon,
        color: color.withOpacity(0.2),
        size: size,
      ),
    );
  }
}

// FEATURE ITEM
class FeatureItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Color iconColor;

  const FeatureItem({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 40, color: iconColor),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF333333),
                  )),
              const SizedBox(height: 4),
              Text(description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF666666),
                  )),
            ],
          ),
        ),
      ],
    );
  }
}

// PAINTERS (ONDA, PADRÃO, BATIMENTOS)
class MedicalPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0277BD).withOpacity(0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    const double spacing = 40.0;
    for (double x = -size.height; x < size.width + size.height; x += spacing) {
      final path = Path()
        ..moveTo(x, 0)
        ..lineTo(x + size.height, size.height);
      canvas.drawPath(path, paint);
    }

    for (double x = -size.height; x < size.width + size.height; x += spacing) {
      final path = Path()
        ..moveTo(x, 0)
        ..lineTo(x - size.height, size.height);
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class WavePainter extends CustomPainter {
  final List<Color> colors;

  WavePainter({required this.colors});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    final path = Path();

    final gradient = LinearGradient(
      colors: colors,
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );

    paint.shader = gradient.createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    paint.style = PaintingStyle.fill;

    path.moveTo(0, size.height * 0.2);
    path.quadraticBezierTo(size.width * 0.25, size.height * 0.4, size.width * 0.5, size.height * 0.2);
    path.quadraticBezierTo(size.width * 0.75, 0, size.width, size.height * 0.2);
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class BottomWavePainter extends CustomPainter {
  final List<Color> colors;

  BottomWavePainter({required this.colors});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    final path = Path();

    final gradient = LinearGradient(
      colors: colors,
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );

    paint.shader = gradient.createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    paint.style = PaintingStyle.fill;

    path.moveTo(0, size.height * 0.8);
    path.quadraticBezierTo(size.width * 0.25, size.height * 0.6, size.width * 0.5, size.height * 0.8);
    path.quadraticBezierTo(size.width * 0.75, size.height, size.width, size.height * 0.8);
    path.lineTo(size.width, 0);
    path.lineTo(0, 0);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
// BATIMENTO CARDÍACO
class HeartbeatLinePainter extends CustomPainter {
  final double progress;
  final Color color;

  HeartbeatLinePainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final path = Path();
    final width = size.width;
    final height = size.height;
    final segment = width * progress;

    path.moveTo(0, height / 2);
    for (double x = 0; x < segment; x += width / 10) {
      path.lineTo(x, height / 2);
      path.lineTo(x + width / 40, height / 4);
      path.lineTo(x + width / 20, height * 3 / 4);
      path.lineTo(x + width / 10, height / 2);
    }
    path.lineTo(segment, height / 2);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

// SPLASH SCREEN
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.6, curve: Curves.easeIn),
      ),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.2, 0.8, curve: Curves.easeOutBack),
      ),
    );

    _controller.forward();

    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/welcome');
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: MedicalPatternPainter())),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: CustomPaint(
              painter: WavePainter(
                colors: [
                  const Color(0xFF0277BD).withOpacity(0.15),
                  const Color(0xFF00BCD4).withOpacity(0.15),
                ],
              ),
              size: Size(MediaQuery.of(context).size.width, 300),
            ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: CustomPaint(
              painter: BottomWavePainter(
                colors: [
                  const Color(0xFF00BCD4).withOpacity(0.15),
                  const Color(0xFF4CAF50).withOpacity(0.15),
                ],
              ),
              size: Size(MediaQuery.of(context).size.width, 300),
            ),
          ),
          Center(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return FadeTransition(
                  opacity: _fadeAnimation,
                  child: ScaleTransition(
                    scale: _scaleAnimation,
                    child: child,
                  ),
                );
              },
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.network(
                    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/babysafe_logo-Uhgxgs9VY2FbBx4YgJZGZlFptk5Vk7.png',
                    height: 200,
                    width: 200,
                  ),
                  const SizedBox(height: 30),
                  const Text(
                    'Monitoramento de saúde infantil',
                    style: TextStyle(
                      fontSize: 16,
                      color: Color(0xFF4CAF50),
                      fontWeight: FontWeight.w500,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 40),
                  const SizedBox(
                    width: 40,
                    height: 40,
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00BCD4)),
                      strokeWidth: 3,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// BREVEMENTE: WELCOME, LOGIN, REGISTER, DASHBOARD...
// WELCOME SCREEN
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: MedicalPatternPainter())),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: CustomPaint(
              painter: WavePainter(
                colors: [
                  const Color(0xFF0277BD).withOpacity(0.15),
                  const Color(0xFF00BCD4).withOpacity(0.15),
                ],
              ),
              size: Size(MediaQuery.of(context).size.width, 300),
            ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: CustomPaint(
              painter: BottomWavePainter(
                colors: [
                  const Color(0xFF00BCD4).withOpacity(0.15),
                  const Color(0xFF4CAF50).withOpacity(0.15),
                ],
              ),
              size: Size(MediaQuery.of(context).size.width, 300),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                children: [
                  const SizedBox(height: 60),
                  Image.network(
                    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/babysafe_logo-Uhgxgs9VY2FbBx4YgJZGZlFptk5Vk7.png',
                    height: 200,
                    width: 200,
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4CAF50).withOpacity(0.08),
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: const Text(
                      'Bem-vindo ao BabySafe Crib',
                      style: TextStyle(
                        fontSize: 16,
                        color: Color(0xFF4CAF50),
                        fontWeight: FontWeight.w500,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  const FeatureItem(
                    icon: Icons.health_and_safety,
                    title: 'Monitoramento em Tempo Real',
                    description: 'Acompanhe a saúde do seu bebê a qualquer momento.',
                    iconColor: Color(0xFF0277BD),
                  ),
                  const SizedBox(height: 20),
                  const FeatureItem(
                    icon: Icons.notifications_active,
                    title: 'Alertas Instantâneos',
                    description: 'Receba notificações sobre qualquer anormalidade.',
                    iconColor: Color(0xFF00BCD4),
                  ),
                  const SizedBox(height: 20),
                  const FeatureItem(
                    icon: Icons.trending_up,
                    title: 'Relatórios Detalhados',
                    description: 'Acesse dados e relatórios para o pediatra.',
                    iconColor: Color(0xFF4CAF50),
                  ),
                  const SizedBox(height: 40),
                  PrimaryButton(
                    text: 'COMEÇAR',
                    icon: Icons.arrow_forward_rounded,
                    onPressed: () => Navigator.of(context).pushNamed('/login'),
                  ),
                  const SizedBox(height: 16),
                  SecondaryButton(
                    text: 'CRIAR CONTA',
                    icon: Icons.person_add_rounded,
                    onPressed: () => Navigator.of(context).pushNamed('/register'),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// LOGIN SCREEN
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    setState(() => _isLoading = true);
    try {
      final email = _emailController.text.trim();
      final password = _passwordController.text.trim();

      if (email.isEmpty || password.isEmpty) {
        context.showSnackBar('Por favor, preencha todos os campos', isError: true);
        return;
      }

      bool loginSuccess = UserManager.loginUser(email, password);

      if (loginSuccess) {
        if (mounted) {
          context.showSnackBar('Login bem-sucedido!');
          Navigator.of(context).pushReplacementNamed('/dashboard');
        }
      } else {
        if (mounted) {
          context.showSnackBar('Email ou senha incorretos', isError: true);
        }
      }
    } catch (error) {
      if (mounted) {
        context.showSnackBar('Erro inesperado ocorreu', isError: true);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 60),
              Image.network(
                'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/babysafe_logo-Uhgxgs9VY2FbBx4YgJZGZlFptk5Vk7.png',
                height: 200,
                width: 200,
              ),
              const SizedBox(height: 30),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email),
                ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: 'Senha',
                  prefixIcon: const Icon(Icons.lock),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility : Icons.visibility_off,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
              const SizedBox(height: 30),
              PrimaryButton(
                text: 'ENTRAR',
                icon: Icons.login,
                onPressed: _isLoading ? () {} : _signIn,
              ),
              const SizedBox(height: 16),
              SecondaryButton(
                text: 'CRIAR CONTA',
                icon: Icons.person_add,
                onPressed: () => Navigator.of(context).pushNamed('/register'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
// REGISTER SCREEN
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _signUp() async {
    setState(() => _isLoading = true);
    try {
      final name = _nameController.text.trim();
      final email = _emailController.text.trim();
      final password = _passwordController.text.trim();

      if (name.isEmpty || email.isEmpty || password.isEmpty) {
        context.showSnackBar('Por favor, preencha todos os campos', isError: true);
        return;
      }

      if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(email)) {
        context.showSnackBar('Formato de email inválido', isError: true);
        return;
      }

      bool registerSuccess = UserManager.registerUser(name, email, password);

      if (registerSuccess) {
        if (mounted) {
          context.showSnackBar('Registro bem-sucedido!');
          Navigator.of(context).pushReplacementNamed('/dashboard');
        }
      } else {
        if (mounted) {
          context.showSnackBar('Email já registrado', isError: true);
        }
      }
    } catch (error) {
      if (mounted) {
        context.showSnackBar('Erro inesperado ocorreu', isError: true);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 60),
              Image.network(
                'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/babysafe_logo-Uhgxgs9VY2FbBx4YgJZGZlFptk5Vk7.png',
                height: 200,
                width: 200,
              ),
              const SizedBox(height: 30),
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Nome Completo',
                  prefixIcon: Icon(Icons.person),
                ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email),
                ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: 'Senha',
                  prefixIcon: const Icon(Icons.lock),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility : Icons.visibility_off,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
              const SizedBox(height: 30),
              PrimaryButton(
                text: 'CADASTRAR',
                icon: Icons.person_add,
                onPressed: _isLoading ? () {} : _signUp,
              ),
              const SizedBox(height: 16),
              SecondaryButton(
                text: 'FAZER LOGIN',
                icon: Icons.login,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// DASHBOARD SCREEN
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.network(
              'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/babysafe_logo-Uhgxgs9VY2FbBx4YgJZGZlFptk5Vk7.png',
              height: 200,
              width: 200,
            ),
            const SizedBox(height: 20),
            const Text(
              'Bem-vindo ao BabySafe!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0277BD),
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Aqui você pode monitorar a saúde do seu bebê.',
              style: TextStyle(
                fontSize: 16,
                color: Color(0xFF666666),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
