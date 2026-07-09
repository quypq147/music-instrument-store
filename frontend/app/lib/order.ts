export function formatOrderCode(order: { id: string; orderNumber?: number }): string {
  if (order.orderNumber) {
    return `#${order.orderNumber}`;
  }
  // Đơn hàng cũ tạo trước khi có orderNumber: rút gọn id dài cho dễ đọc hơn
  return `#${order.id.slice(-6).toUpperCase()}`;
}
