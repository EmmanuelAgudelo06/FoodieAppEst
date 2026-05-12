import React, { useState, useEffect, useContext } from 'react';
import {View,Text,FlatList,TouchableOpacity,Image,ActivityIndicator,TextInput,ScrollView,StyleSheet} from 'react-native';
import { CartContext } from '../context/CartContext';
import { db } from '../config/firebase';
import { LOCAL_MENU, CATEGORIES } from '../utils/seedData';
import { COLORS, globalStyles } from '../styles/globalStyles';

const MenuScreen = ({ navigation }) => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchText, setSearchText] = useState(''); // F01
  const { cartCount } = useContext(CartContext);

  // Bug #10: faltaba el "[]" como dependencia → useEffect corría en cada re-render, creando un bucle infinito de peticiones
  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const snapshot = await db.collection('menu').get();
      if (!snapshot.empty) {
        const menuData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDishes(menuData);
      } else {
        setDishes(LOCAL_MENU);
      }
    } catch (error) {
      console.log('Using local menu data:', error.message);
      setDishes(LOCAL_MENU);
    } finally {
      setLoading(false);
    }
  };

  // F01 + F04: aplica filtro de categoría y de búsqueda por texto en tiempo real
  const filteredDishes = dishes
    .filter(dish => selectedCategory === 'Todas' || dish.category === selectedCategory)
    .filter(dish => dish.name.toLowerCase().includes(searchText.toLowerCase()));

  const renderDishItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dishCard}
      onPress={() =>
        navigation.navigate('DishDetail', {
          dishId: item.id,
          dishName: item.name,
          dishPrice: item.price,
          dishDescription: item.description,
          dishImage: item.image,
          dishRating: item.rating,
          dishCategory: item.category,
        })
      }
    >
      <Image
        source={{ uri: item.image }}
        style={styles.dishImage}
        resizeMode="cover"
      />
      <View style={styles.dishInfo}>
        <Text style={styles.dishName}>{item.name}</Text>
        <Text style={styles.dishCategory}>{item.category}</Text>
        <View style={styles.dishFooter}>
          <Text style={styles.dishPrice}>
            ${item.price.toLocaleString('es-CO')}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.emptyState]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={globalStyles.emptyText}>Cargando menú...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={globalStyles.title}>FoodieApp 🍽️</Text>
        <Text style={globalStyles.bodyText}>
          {filteredDishes.length} platos disponibles
        </Text>
      </View>

      {/* F01: Barra de búsqueda con botón para limpiar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar platos..."
          placeholderTextColor={COLORS.disabled}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* F04: Filtro horizontal de categorías con chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {CATEGORIES.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredDishes}
        renderItem={renderDishItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>
              {searchText
                ? `No se encontraron platos para "${searchText}"`
                : 'No hay platos disponibles'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  // F01: estilos de la barra de búsqueda
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  // F04: estilos de los chips de categoría
  categoriesScroll: {
    marginBottom: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  dishCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  dishImage: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.border,
  },
  dishInfo: {
    padding: 14,
  },
  dishName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  dishCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  dishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    fontSize: 16,
    color: COLORS.star,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

export default MenuScreen;
