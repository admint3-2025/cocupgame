import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Vibration,
  Image,
  ScrollView
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { getRandomWords } from './src/data/words';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [gameState, setGameState] = useState('menu'); // menu, categories, countdown, playing, finished
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [countdown, setCountdown] = useState(3);
  const [currentWord, setCurrentWord] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [words, setWords] = useState([]);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [subscription, setSubscription] = useState(null);
  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0 });
  const [flashFeedback, setFlashFeedback] = useState(null); // 'correct', 'pass', or null
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const lastActionTime = useRef(0);
  const gameStateRef = useRef('menu');
  const wordsRef = useRef([]);
  const wordIndexRef = useRef(0);
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    wordIndexRef.current = wordIndex;
  }, [wordIndex]);

  useEffect(() => {
    if (gameState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'countdown' && countdown === 0) {
      // Iniciar el juego
      setGameState('playing');
      _subscribe();
    }
  }, [gameState, countdown]);

  useEffect(() => {
    return () => {
      _unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      endGame();
    }
  }, [gameState, timeLeft]);

  const _subscribe = () => {
    setSubscription(
      Accelerometer.addListener(accelerometerData => {
        const { x, y, z } = accelerometerData;
        setAccelData({ x, y, z });
        const now = Date.now();
        
        // Verificar estado usando ref (siempre actualizado)
        if (gameStateRef.current !== 'playing') return;
        
        // Debounce: 500ms entre detecciones
        if (now - lastActionTime.current < 500) return;
        
        // Teléfono EN LA FRENTE landscape (pantalla hacia ti):
        // Inclinar cabeza hacia ABAJO = Z positivo = CORRECTO
        // Inclinar cabeza hacia ARRIBA = Z negativo = PASAR
        
        if (z < -0.4) {
          console.log('✋ PASAR Z:', z.toFixed(2));
          lastActionTime.current = now;
          handlePass();
        }
        else if (z > 0.4) {
          console.log('✅ CORRECTO Z:', z.toFixed(2));
          lastActionTime.current = now;
          handleCorrect();
        }
      })
    );
    Accelerometer.setUpdateInterval(100);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const startGame = async (category) => {
    // Solicitar permiso del acelerómetro
    const { status } = await Accelerometer.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Necesitamos permiso para usar el acelerómetro');
      return;
    }
    
    // Verificar disponibilidad
    const isAvailable = await Accelerometer.isAvailableAsync();
    if (!isAvailable) {
      alert('El acelerómetro no está disponible en este dispositivo');
      return;
    }
    
    // Preparar el juego
    const gameWords = getRandomWords(category, 50);
    setWords(gameWords);
    setCurrentWord(gameWords[0]);
    setWordIndex(0);
    setScore(0);
    setPassed(0);
    setTimeLeft(60);
    lastActionTime.current = 0;
    setCountdown(3);
    setGameState('countdown');
  };

  const endGame = () => {
    setGameState('finished');
    _unsubscribe();
  };

  const showExitDialog = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    setGameState('menu');
    _unsubscribe();
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  const nextWord = () => {
    const currentIndex = wordIndexRef.current;
    const allWords = wordsRef.current;
    console.log('🔄 nextWord llamado. wordIndex actual:', currentIndex, 'total palabras:', allWords.length);
    const nextIndex = currentIndex + 1;
    console.log('🔄 Cambiando palabra:', currentIndex, '->', nextIndex);
    if (nextIndex < allWords.length) {
      setWordIndex(nextIndex);
      setCurrentWord(allWords[nextIndex]);
      console.log('📝 Nueva palabra:', allWords[nextIndex]);
    } else {
      console.log('🏁 Fin del juego');
      endGame();
    }
  };

  const handleCorrect = () => {
    console.log('🎯 handleCorrect llamado, estado:', gameStateRef.current);
    if (gameStateRef.current !== 'playing') {
      console.log('❌ No está en estado playing:', gameStateRef.current);
      return;
    }
    
    // Mostrar feedback visual verde
    setFlashFeedback('correct');
    setTimeout(() => setFlashFeedback(null), 300);
    
    // Vibración más larga para correcto
    Vibration.vibrate(300);
    
    // Cambiar palabra inmediatamente
    nextWord();
    
    // Actualizar score después
    setScore(prev => {
      console.log('✅ Score aumentado:', prev, '->', prev + 1);
      return prev + 1;
    });
  };

  const handlePass = () => {
    console.log('👋 handlePass llamado, estado:', gameStateRef.current);
    if (gameStateRef.current !== 'playing') {
      console.log('❌ No está en estado playing:', gameStateRef.current);
      return;
    }
    
    // Mostrar feedback visual rojo
    setFlashFeedback('pass');
    setTimeout(() => setFlashFeedback(null), 300);
    
    // Vibración doble más larga para pasar
    Vibration.vibrate([0, 150, 100, 150]);
    
    // Cambiar palabra inmediatamente
    nextWord();
    
    // Actualizar passed después
    setPassed(prev => {
      console.log('⏭️ Passed aumentado:', prev, '->', prev + 1);
      return prev + 1;
    });
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-15, 15],
    outputRange: ['-15deg', '15deg']
  });

  if (gameState === 'menu') {
    return (
      <View style={styles.menuContainer}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.menuLeft}>
          <Image 
            source={require('./assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>COC UP! GAME</Text>
          <Text style={styles.slogan}>Hecho por papá, conquistado por Camila.</Text>
        </View>
        
        <View style={styles.menuRight}>
          <View style={styles.instructionsGrid}>
            <View style={styles.instructionCard}>
              <Text style={styles.instructionText}>Inclina arriba</Text>
              <View style={[styles.button, styles.correctButton]}>
                <Text style={styles.buttonText}>Correcto</Text>
              </View>
            </View>

            <View style={styles.instructionCard}>
              <Text style={styles.instructionText}>Inclina abajo</Text>
              <View style={[styles.button, styles.passButton]}>
                <Text style={styles.buttonText}>Pasar</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => setGameState('categories')}
          >
            <Text style={styles.startButtonText}>JUGAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (gameState === 'categories') {
    const categories = [
      { id: 'all', name: 'Todas', icon: '🎲', color: '#FF6B6B' },
      { id: 'animals', name: 'Animales', icon: '🦁', color: '#4ECDC4' },
      { id: 'movies', name: 'Películas', icon: '🎬', color: '#FFE66D' },
      { id: 'objects', name: 'Objetos', icon: '📱', color: '#95E1D3' },
      { id: 'professions', name: 'Profesiones', icon: '👨‍⚕️', color: '#F38181' },
      { id: 'actions', name: 'Acciones', icon: '🏃', color: '#A8E6CF' },
      { id: 'countries', name: 'Países', icon: '🌍', color: '#A78BFA' },
      { id: 'food', name: 'Comida', icon: '🍕', color: '#FBBF24' },
      { id: 'sports', name: 'Deportes', icon: '⚽', color: '#34D399' },
      { id: 'music', name: 'Música', icon: '🎸', color: '#F472B6' },
      { id: 'emotions', name: 'Emociones', icon: '😊', color: '#FB923C' },
      { id: 'nature', name: 'Naturaleza', icon: '🌳', color: '#6EE7B7' },
      { id: 'songs', name: 'Canciones', icon: '🎵', color: '#EC4899' },
      { id: 'coming1', name: 'Próximamente', icon: '🔒', color: '#94A3B8', disabled: true },
      { id: 'coming2', name: 'Próximamente', icon: '🔒', color: '#94A3B8', disabled: true },
      { id: 'coming3', name: 'Próximamente', icon: '🔒', color: '#94A3B8', disabled: true },
    ];

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.categoriesHeader}>
          <Text style={styles.categoriesTitle}>Selecciona una categoría</Text>
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard, 
                  { backgroundColor: category.color },
                  category.disabled && styles.categoryDisabled
                ]}
                onPress={() => {
                  if (!category.disabled) {
                    setSelectedCategory(category.id);
                    startGame(category.id);
                  }
                }}
                disabled={category.disabled}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setGameState('menu')}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (gameState === 'countdown') {
    return (
      <View style={styles.countdownContainer}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.countdownContent}>
          <Text style={styles.countdownInstruction}>
            ¡Coloca el teléfono{'\n'}en tu frente!
          </Text>
          
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownNumber}>
              {countdown === 0 ? '¡YA!' : countdown}
            </Text>
          </View>
          
          <Text style={styles.countdownHint}>
            El juego comenzará en un momento...
          </Text>
        </View>
      </View>
    );
  }

  if (gameState === 'playing') {
    return (
      <View style={styles.gameContainer}>
        <StatusBar barStyle="light-content" />
        
        {/* Overlay de feedback */}
        {flashFeedback && (
          <View style={[
            styles.flashOverlay,
            flashFeedback === 'correct' ? styles.flashCorrect : styles.flashPass
          ]} />
        )}
        
        <View style={styles.gameHeader}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Correctas</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{timeLeft}s</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Pasadas</Text>
            <Text style={styles.scoreValue}>{passed}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.exitButton}
          onPress={showExitDialog}
        >
          <Text style={styles.exitButtonText}>✕ Salir</Text>
        </TouchableOpacity>

        <View style={styles.wordContainer}>
          <Animated.View 
            style={[
              styles.wordCard,
              {
                transform: [
                  { rotate: rotateInterpolate },
                  { scale: scale }
                ]
              }
            ]}
          >
            <Text style={styles.wordText}>{currentWord}</Text>
          </Animated.View>
        </View>

        {/* Modal de confirmación de salida - al final para estar encima */}
        {showExitConfirm && (
          <View style={styles.exitModal}>
            <View style={styles.exitModalContent}>
              <Text style={styles.exitModalTitle}>¿Salir del juego?</Text>
              
              <View style={styles.exitResultsGrid}>
                <View style={styles.exitResultCard}>
                  <View style={[styles.iconCircle, styles.correctCircle]}>
                    <Text style={styles.resultIcon}>✓</Text>
                  </View>
                  <Text style={styles.exitResultValue}>{score}</Text>
                  <Text style={styles.exitResultLabel}>Correctas</Text>
                </View>
                
                <View style={styles.exitResultCard}>
                  <View style={[styles.iconCircle, styles.passCircle]}>
                    <Text style={styles.resultIcon}>⟳</Text>
                  </View>
                  <Text style={styles.exitResultValue}>{passed}</Text>
                  <Text style={styles.exitResultLabel}>Pasadas</Text>
                </View>
              </View>

              <View style={styles.exitModalButtons}>
                <TouchableOpacity 
                  style={[styles.exitModalButton, styles.exitConfirmButton]}
                  onPress={confirmExit}
                >
                  <Text style={styles.exitModalButtonText}>Sí, salir</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.exitModalButton, styles.exitCancelButton]}
                  onPress={cancelExit}
                >
                  <Text style={styles.exitModalButtonText}>Continuar jugando</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  if (gameState === 'finished') {
    return (
      <View style={styles.finishedContainer}>
        <StatusBar barStyle="light-content" />
        
        <Image 
          source={require('./assets/logo.png')} 
          style={styles.watermarkLogo}
          resizeMode="contain"
        />
        
        <View style={styles.finishedContent}>
          <Text style={styles.finishTitle}>¡Juego Terminado!</Text>
          
          <View style={styles.resultsGrid}>
            <View style={styles.resultCard}>
              <View style={[styles.iconCircle, styles.correctCircle]}>
                <Text style={styles.resultIcon}>✓</Text>
              </View>
              <Text style={styles.resultValue}>{score}</Text>
              <Text style={styles.resultLabel}>Correctas</Text>
            </View>
            
            <View style={styles.resultCard}>
              <View style={[styles.iconCircle, styles.passCircle]}>
                <Text style={styles.resultIcon}>⟳</Text>
              </View>
              <Text style={styles.resultValue}>{passed}</Text>
              <Text style={styles.resultLabel}>Pasadas</Text>
            </View>
          </View>

          <View style={styles.finishedButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.playAgainButton]}
              onPress={() => setGameState('categories')}
            >
              <Text style={styles.actionButtonText}>JUGAR DE NUEVO</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.menuButton]}
              onPress={() => setGameState('menu')}
            >
              <Text style={styles.actionButtonText}>MENÚ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5E60CE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  menuContainer: {
    flex: 1,
    backgroundColor: '#5E60CE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 40,
  },
  menuLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: width * 0.35,
    height: height * 0.45,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  slogan: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  instructionsGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  instructionCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 15,
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 60,
    alignItems: 'center',
  },
  instruction: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  passButton: {
    backgroundColor: '#FF4081',
  },
  correctButton: {
    backgroundColor: '#00BCD4',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 80,
    paddingVertical: 25,
    borderRadius: 30,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  countdownContainer: {
    flex: 1,
    backgroundColor: '#5E60CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownInstruction: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 40,
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: 'white',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  countdownNumber: {
    fontSize: 80,
    fontWeight: 'bold',
    color: 'white',
  },
  countdownHint: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  categoriesHeader: {
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
  },
  categoriesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    width: '100%',
  },
  categoryCard: {
    width: (width - 85) / 4, // Mejor distribución
    height: 105,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  categoryDisabled: {
    opacity: 0.5,
  },
  categoryIcon: {
    fontSize: 38,
    marginBottom: 6,
  },
  categoryName: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#5E60CE',
    position: 'relative',
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    opacity: 0.4,
  },
  flashCorrect: {
    backgroundColor: '#00FF88',
  },
  flashPass: {
    backgroundColor: '#FF3366',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  exitButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  exitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exitModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  exitModalContent: {
    backgroundColor: '#5E60CE',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    maxWidth: width * 0.75,
    borderWidth: 3,
    borderColor: 'white',
  },
  exitModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 18,
    textAlign: 'center',
  },
  exitResultsGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 18,
  },
  exitResultCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    minWidth: 110,
  },
  exitResultValue: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exitResultLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  exitModalButtons: {
    width: '100%',
    gap: 10,
  },
  exitModalButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  exitConfirmButton: {
    backgroundColor: '#FF6B6B',
  },
  exitCancelButton: {
    backgroundColor: '#4ECDC4',
  },
  exitModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'white',
    fontSize: 14,
  },
  scoreValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timerContainer: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  timerText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  wordContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  wordCard: {
    backgroundColor: '#3840CE',
    paddingHorizontal: 60,
    paddingVertical: 80,
    borderRadius: 40,
    width: width * 0.95,
    minHeight: height * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  wordText: {
    color: 'white',
    fontSize: 64,
    fontWeight: 'bold',
    textAlign: 'center',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  hintContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  hintText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  hintSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  debugContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  manualButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  manualButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 130,
    alignItems: 'center',
  },
  passButtonManual: {
    backgroundColor: '#FF4081',
  },
  correctButtonManual: {
    backgroundColor: '#00BCD4',
  },
  manualButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  controlsHint: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  controlIcon: {
    fontSize: 24,
    marginRight: 10,
    color: 'white',
  },
  controlText: {
    color: 'white',
    fontSize: 14,
  },
  finishTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  finishedContainer: {
    flex: 1,
    backgroundColor: '#5E60CE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 20,
  },
  watermarkLogo: {
    position: 'absolute',
    width: width * 0.95,
    height: height * 0.95,
    opacity: 0.08,
    zIndex: 0,
  },
  finishedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  resultsGrid: {
    flexDirection: 'row',
    gap: 25,
    marginBottom: 25,
  },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  correctCircle: {
    backgroundColor: '#00D9A3',
  },
  passCircle: {
    backgroundColor: '#FF6B9D',
  },
  resultIcon: {
    fontSize: 38,
    color: 'white',
    fontWeight: 'bold',
  },
  resultValue: {
    color: 'white',
    fontSize: 50,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  finishedButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    minWidth: 180,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  playAgainButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 30,
    marginBottom: 40,
    width: '90%',
  },
  resultItem: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultLabel: {
    color: 'white',
    fontSize: 18,
    marginBottom: 5,
  },
  resultValue: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  menuButton: {
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: 'white',
  },
});
