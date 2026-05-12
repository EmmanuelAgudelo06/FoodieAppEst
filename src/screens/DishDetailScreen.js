import React, { useContext, useState, useEffect } from 'react';
// Bug #1: ScrollView no estaba importado pero se usaba en el render → crash al abrir el detalle
import {View,Text,Image,TouchableOpacity,Alert,ScrollView,StyleSheet} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartContext } from '../context/CartContext';
import { COLORS, globalStyles } from '../styles/globalStyles';

const FAVORITES_KEY = '@foodie_favorites';

const DishDetailScreen = ({ route, navigation }) => {
  const { addToCart } = useContext(CartContext);
  // Bug #2: era "const { dish } = route.params" — no existe clave "dish", dish era undefined y crasheaba
  const dish = route.params;

  // F02: estado de favorito para este plato
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, []);

  const checkFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      const favorites = stored ? JSON.parse(stored) : [];
      setIsFavorite(favorites.some(f => f.id === dish.dishId));
    } catch (error) {}
  };

  const toggleFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      let favorites = stored ? JSON.parse(stored) : [];
      if (isFavorite) {
        favorites = favorites.filter(f => f.id !== dish.dishId);
      } else {
        favorites.push({
          id: dish.dishId,
          name: dish.dishName,
          price: dish.dishPrice,
          image: dish.dishImage,
          category: dish.dishCategory,
          rating: dish.dishRating,
        });
      }
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (error) {}
  };

  const handleAddToCart = () => {
    addToCart({
      id: dish.dishId,         
      name: dish.dishName,
      price: dish.dishPrice,
      image: dish.dishImage,
    });
    Alert.alert(
      '¡Agregado!',
      `${dish.dishName} se agregó al carrito`,
      [
        { text: 'Seguir viendo', style: 'cancel' },
        { text: 'Ver carrito', onPress: () => navigation.navigate('CartTab') },
      ]
    );
  };

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['bottom']}>
      <ScrollView style={globalStyles.container}>
        <Image
          source={{ uri: dish?.dishImage || 'https://via.placeholder.com/400x250' }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.dishName}>{dish?.dishName || 'Plato no encontrado'}</Text>
            <View style={styles.headerActions}>
              {/* F02: botón de favorito que alterna entre ♡ y ♥ */}
              <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
                <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteIconActive]}>
                  {isFavorite ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingText}>{dish?.dishRating || '0.0'}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.category}>{dish?.dishCategory || 'Sin categoría'}</Text>

          <Text style={styles.price}>
            ${(dish?.dishPrice || 0).toLocaleString('es-CO')}
          </Text>

          <View style={globalStyles.divider} />

          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>
            {dish?.dishDescription || 'Sin descripción disponible.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addToCartButton}
          // Bug #3: era "onClick" → propiedad de HTML, no existe en React Native, el botón no hacía nada
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>🛒 Agregar al Carrito</Text>
          <Text style={styles.addToCartPrice}>
            ${(dish?.dishPrice || 0).toLocaleString('es-CO')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.border,
  },
  contentContainer: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // F02: estilos del botón de favorito
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 26,
    color: COLORS.border,
  },
  favoriteIconActive: {
    color: COLORS.error,
  },
  dishName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingStar: {
    fontSize: 16,
    color: COLORS.star,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  category: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 10,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  addToCartPrice: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default DishDetailScreen;
