import React, { useState, useEffect } from 'react';
// Bug #4: ScrollView no estaba importado, causaba crash al abrir el perfil
import {View,Text,TextInput,TouchableOpacity,Alert,ScrollView,Switch,Image,StyleSheet} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../styles/globalStyles';

const STORAGE_KEY = '@foodie_user_profile';
const FAVORITES_KEY = '@foodie_favorites'; // F02
const DARK_MODE_KEY = '@foodie_dark_mode'; // F05

// F05: paleta de colores para modo oscuro
const darkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
};

const ProfileScreen = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // F05: estado del modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(false);

  // F02: lista de platos favoritos
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadProfile();
    loadDarkMode();   // F05
    loadFavorites();  // F02
  }, []);

  // F05: activa/desactiva el modo oscuro y lo persiste
  const theme = isDarkMode ? darkTheme : {
    background: COLORS.background,
    surface: COLORS.surface,
    textPrimary: COLORS.textPrimary,
    textSecondary: COLORS.textSecondary,
    border: COLORS.border,
  };

  const loadDarkMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(DARK_MODE_KEY);
      if (stored !== null) setIsDarkMode(JSON.parse(stored));
    } catch (error) {}
  };

  const toggleDarkMode = async (value) => {
    setIsDarkMode(value);
    try {
      await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(value));
    } catch (error) {}
  };

  // F02: carga los favoritos guardados en AsyncStorage
  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch (error) {}
  };

  // F02: elimina un plato de favoritos
  const removeFavorite = async (dishId) => {
    const updated = favorites.filter(f => f.id !== dishId);
    setFavorites(updated);
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (error) {}
  };

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Bug #5: era "const profile = stored" — sin JSON.parse los campos siempre eran undefined
        const profile = JSON.parse(stored);
        setUserName(profile.name || '');
        setUserEmail(profile.email || '');
        setUserPhone(profile.phone || '');
        setUserAddress(profile.address || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      const profile = {
        name: userName,
        email: userEmail,
        phone: userPhone,
        address: userAddress,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setIsEditing(false);
      Alert.alert('¡Guardado!', 'Tu perfil ha sido actualizado.');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    }
  };

  const clearProfile = async () => {
    Alert.alert(
      'Borrar perfil',
      '¿Estás seguro de que deseas borrar toda tu información?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setUserName('');
            setUserEmail('');
            setUserPhone('');
            setUserAddress('');
            setIsEditing(false);
            Alert.alert('Perfil borrado', 'Tu información ha sido eliminada.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={[globalStyles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[globalStyles.title, { color: theme.textPrimary }]}>Mi Perfil 👤</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.avatarText}>
                {userName ? userName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <Text style={[styles.avatarName, { color: theme.textPrimary }]}>
              {userName || 'Sin nombre'}
            </Text>
          </View>

          <View style={[globalStyles.divider, { backgroundColor: theme.border }]} />

          {/* Campos del perfil */}
          {[
            { label: 'Nombre completo', value: userName, setter: setUserName, placeholder: 'Tu nombre', keyboardType: 'default' },
            { label: 'Correo electrónico', value: userEmail, setter: setUserEmail, placeholder: 'correo@ejemplo.com', keyboardType: 'email-address' },
            { label: 'Teléfono', value: userPhone, setter: setUserPhone, placeholder: '300 123 4567', keyboardType: 'phone-pad' },
          ].map(field => (
            <View key={field.label} style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{field.label}</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  { borderColor: theme.border, color: theme.textPrimary, backgroundColor: isEditing ? theme.surface : theme.background },
                ]}
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.disabled}
                keyboardType={field.keyboardType}
                autoCapitalize="none"
                editable={isEditing}
              />
            </View>
          ))}

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Dirección de entrega</Text>
            <TextInput
              style={[
                styles.fieldInput,
                styles.fieldMultiline,
                { borderColor: theme.border, color: theme.textPrimary, backgroundColor: isEditing ? theme.surface : theme.background },
              ]}
              value={userAddress}
              onChangeText={setUserAddress}
              placeholder="Calle, número, barrio, ciudad"
              placeholderTextColor={COLORS.disabled}
              multiline
              numberOfLines={3}
              editable={isEditing}
            />
          </View>

          <View style={styles.buttonContainer}>
            {isEditing ? (
              <>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.secondary }]} onPress={saveProfile}>
                  <Text style={styles.saveButtonText}>💾 Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
                  onPress={() => { setIsEditing(false); loadProfile(); }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.primary }]} onPress={() => setIsEditing(true)}>
                <Text style={styles.saveButtonText}>✏️ Editar Perfil</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[globalStyles.divider, { backgroundColor: theme.border }]} />

          {/* F05: toggle de modo oscuro */}
          <View style={[styles.darkModeRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.darkModeLabel, { color: theme.textPrimary }]}>
              {isDarkMode ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={isDarkMode ? '#FFFFFF' : COLORS.disabled}
            />
          </View>

          <View style={[globalStyles.divider, { backgroundColor: theme.border }]} />

          {/* F02: sección de platos favoritos */}
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Mis Favoritos ❤️</Text>
          {favorites.length === 0 ? (
            <Text style={[styles.emptyFavorites, { color: theme.textSecondary }]}>
              Aún no tienes platos favoritos. Toca ♡ en el detalle de un plato.
            </Text>
          ) : (
            favorites.map(dish => (
              <View key={dish.id} style={[styles.favoriteItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.favoriteInfo}>
                  <Text style={[styles.favoriteName, { color: theme.textPrimary }]}>{dish.name}</Text>
                  <Text style={[styles.favoriteCategory, { color: theme.textSecondary }]}>{dish.category}</Text>
                  <Text style={[styles.favoritePrice, { color: COLORS.primary }]}>
                    ${dish.price.toLocaleString('es-CO')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeFavorite(dish.id)} style={styles.removeFavoriteButton}>
                  <Text style={styles.removeFavoriteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={[globalStyles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.dangerButton} onPress={clearProfile}>
            <Text style={styles.dangerButtonText}>🗑️ Borrar datos del perfil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  fieldMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 8,
    gap: 10,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // F05: estilos del toggle de modo oscuro
  darkModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  darkModeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  // F02: estilos de la sección de favoritos
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyFavorites: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  favoriteCategory: {
    fontSize: 12,
    marginBottom: 4,
  },
  favoritePrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  removeFavoriteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFavoriteText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '700',
  },
  dangerButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ProfileScreen;
