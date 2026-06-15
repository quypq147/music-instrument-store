"use client";

import { useEffect, useState } from "react";

export default function Cart() {
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const data = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    setCart(data);
  }, []);

  const removeItem = (index: number) => {
    const newCart = [...cart];

    newCart.splice(index, 1);

    setCart(newCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(newCart)
    );
  };

  const totalPrice = cart.reduce(
    (sum, item) =>
      sum +
      Number(
        item.price
          .replaceAll(".", "")
          .replace("đ", "")
      ),
    0
  );

  return (
    <div className="cart-container">
      <h1 className="section-title">
        Giỏ Hàng
      </h1>

      <table className="cart-table">
        <thead>
          <tr>
            <th>Ảnh</th>
            <th>Sản phẩm</th>
            <th>Giá</th>
            <th>Xóa</th>
          </tr>
        </thead>

        <tbody>
          {cart.length === 0 ? (
            <tr>
              <td colSpan={4}>
                Chưa có sản phẩm nào
              </td>
            </tr>
          ) : (
            cart.map((item, index) => (
              <tr key={index}>
                <td>
                  <img
                    src={item.image}
                    className="cart-img"
                  />
                </td>

                <td>{item.name}</td>

                <td>{item.price}</td>

                <td>
                  <button
                    className="delete-btn"
                    onClick={() =>
                      removeItem(index)
                    }
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="cart-summary">
        <h2>
          Tổng sản phẩm: {cart.length}
        </h2>

        <h2>
          Tổng tiền:
          {" "}
          {totalPrice.toLocaleString("vi-VN")}
          đ
        </h2>
      </div>
    </div>
  );
}