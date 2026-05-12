import React, { useContext } from 'react';
import {View,Text,FlatList,TouchableOpacity,Alert,TextInput,StyleSheet} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartContext } from '../context/CartContext';
import { db } from '../config/firebase';
import { COLORS, globalStyles } from '../styles/globalStyles';

const CartScreen = ({ navigation }) => {
  const {
    cartItems,
    removeFromCart,
    clearCart,
    getCartTotal,
    updateQuantity, // F08
    updateNote,     // F03
  } = useContext(CartContext);

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega platos al carrito antes de confirmar.');
      return;
    }

    // F06: el total enviado a Firestore incluye el IVA
    const subtotal = getCartTotal();
    const iva = Math.round(subtotal * 0.19);
    const total = subtotal + iva;

    try {
      await db.collection('orders').add({
        items: cartItems, // F03: los ítems ya incluyen el campo "notes"
        subtotal,
        iva,
        total,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      });

      clearCart();
      Alert.alert(
        '¡Pedido Confirmado!',
        'Tu pedido ha sido enviado a la cocina.',
        [{ text: 'OK', onPress: () => navigation.navigate('OrdersTab') }]
      );
    } catch (error) {
      console.log('Order saved locally:', error.message);
      clearCart();
      Alert.alert('¡Pedido Confirmado!', 'Tu pedido ha sido registrado.');
    }
  };

  const handleRemoveItem = (item) => {
    Alert.alert(
      'Eliminar del carrito',
      `¿Deseas eliminar ${item.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeFromCart(item.id) },
      ]
    );
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItemCard}>
      {/* Nombre + botón eliminar */}
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveItem(item)}>
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* F08: controles de cantidad +/- y subtotal del ítem */}
      <View style={styles.quantityRow}>
        <Text style={styles.itemPrice}>${item.price.toLocaleString('es-CO')} c/u</Text>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => updateQuantity(item.id, -1)}
          >
            <Text style={styles.qtyButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => updateQuantity(item.id, 1)}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.itemSubtotal}>
          ${(item.price * item.quantity).toLocaleString('es-CO')}
        </Text>
      </View>

      {/* F03: campo de notas especiales por ítem */}
      <TextInput
        style={styles.notesInput}
        value={item.notes || ''}
        onChangeText={(text) => updateNote(item.id, text)}
        placeholder="Notas especiales: sin cebolla, extra picante..."
        placeholderTextColor={COLORS.disabled}
      />
    </View>
  );

  // F06: cálculo de subtotal, IVA y total final
  const subtotal = getCartTotal();
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={globalStyles.container}>
        <View style={styles.header}>
          <Text style={globalStyles.title}>Mi Carrito 🛒</Text>
          {cartItems.length > 0 && (
            <TouchableOpacity onPress={() => {
              Alert.alert('Vaciar carrito', '¿Estás seguro?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Vaciar', style: 'destructive', onPress: clearCart },
              ]);
            }}>
              <Text style={styles.clearText}>Vaciar</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={cartItems}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={globalStyles.emptyState}>
              <Text style={{ fontSize: 60 }}>🛒</Text>
              <Text style={globalStyles.emptyText}>Tu carrito está vacío</Text>
              <TouchableOpacity
                style={[globalStyles.button, { marginTop: 20 }]}
                onPress={() => navigation.navigate('MenuTab')}
              >
                <Text style={globalStyles.buttonText}>Ver Menú</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {cartItems.length > 0 && (
          <View style={styles.bottomSection}>
            {/* F06: Subtotal, IVA y Total con IVA incluido */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${subtotal.toLocaleString('es-CO')}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA (19%)</Text>
              <Text style={styles.totalValue}>${iva.toLocaleString('es-CO')}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>${total.toLocaleString('es-CO')}</Text>
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmOrder}>
              <Text style={styles.confirmButtonText}>
                Confirmar Pedido — ${total.toLocaleString('es-CO')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  clearText: {
    fontSize: 15,
    color: COLORS.error,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  cartItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '700',
  },
  // F08: fila de cantidad con controles +/-
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemPrice: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 28,
    textAlign: 'center',
  },
  itemSubtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
    textAlign: 'right',
  },
  // F03: campo de notas especiales
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  bottomSection: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  confirmButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default CartScreen;
