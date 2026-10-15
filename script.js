"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

if (menuToggle && siteNav) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    siteNav.classList.remove("is-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    siteNav.classList.toggle("is-open", !isOpen);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      menuToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      menuToggle.getAttribute("aria-expanded") === "true" &&
      event.target instanceof Node &&
      !siteNav.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });
}

const year = document.querySelector("#year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealTargets = [
  ...document.querySelectorAll(".product-gallery-main, .ingredient-card, .gallery-feature"),
];

if (!reduceMotion && "IntersectionObserver" in window && revealTargets.length > 0) {
  revealTargets.forEach((target, index) => {
    target.classList.add("scroll-reveal");
    if (target.matches(".ingredient-card")) {
      target.style.setProperty("--reveal-delay", `${(index % 4) * 65}ms`);
    }
  });
  document.documentElement.classList.add("motion-ready");

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .12 });

  revealTargets.forEach((target) => revealObserver.observe(target));
}

const productGallery = document.querySelector(".product-gallery");
if (productGallery) {
  const mainImage = productGallery.querySelector(".product-gallery-image");
  const galleryCount = productGallery.querySelector(".product-gallery-count");
  const thumbnails = [...productGallery.querySelectorAll(".product-thumbnail")];
  let imageChange = 0;

  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => {
      const image = thumbnail.dataset.image;
      const alt = thumbnail.dataset.alt;

      if (!mainImage || !image || !alt) {
        return;
      }

      const changeId = ++imageChange;
      const preview = new Image();
      preview.onload = () => {
        if (changeId !== imageChange) {
          return;
        }

        thumbnails.forEach((item, itemIndex) => {
          const isActive = itemIndex === index;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-pressed", String(isActive));
        });

        if (galleryCount) {
          galleryCount.textContent = `${String(index + 1).padStart(2, "0")} / ${String(thumbnails.length).padStart(2, "0")}`;
        }

        mainImage.classList.add("is-changing");
        window.setTimeout(() => {
          if (changeId !== imageChange) {
            return;
          }

          mainImage.src = image;
          mainImage.alt = alt;
          window.requestAnimationFrame(() => {
            if (changeId === imageChange) {
              mainImage.classList.remove("is-changing");
            }
          });
        }, 320);
      };
      preview.onerror = () => {
        if (changeId === imageChange) {
          console.error(`Unable to load product image: ${image}`);
        }
      };
      preview.src = image;
    });
  });
}

const sizeOptions = [...document.querySelectorAll('input[name="product-size"]')];
const productPrice = document.querySelector("#product-price");
const selectedSize = document.querySelector(".selected-size");
const buyButton = document.querySelector(".product-button");
const quantityInput = document.querySelector("#product-quantity");
const cartSummary = document.querySelector(".cart-summary");
const cartItemsList = document.querySelector(".cart-items");
const cartCount = document.querySelector(".cart-count");
const cartTotal = document.querySelector(".cart-total");
const cartWhatsapp = document.querySelector(".cart-whatsapp");
const addToCartButton = document.querySelector(".add-to-cart");
const orderDialog = document.querySelector(".order-dialog");
const orderForm = document.querySelector(".order-form");
const orderFormText = orderForm?.querySelector('input[name="text"]');
const locationInput = document.querySelector("#google-maps-location");
const locationButton = document.querySelector(".location-button");
const locationStatus = document.querySelector(".location-status");
let pendingOrder = [];
const cart = new Map();

const getSelectedProduct = () => {
  const selectedOption = sizeOptions.find((option) => option.checked);
  if (!selectedOption) {
    return null;
  }

  return {
    size: selectedOption.value,
    price: Number(selectedOption.dataset.price),
  };
};

const getQuantity = () => {
  const quantity = Number(quantityInput?.value);
  return Number.isSafeInteger(quantity) && quantity >= 1 ? quantity : 1;
};

const updateProductSelection = () => {
  const selectedProduct = getSelectedProduct();
  if (!selectedProduct) {
    return;
  }

  document.querySelectorAll(".size-option").forEach((label) => {
    const input = label.querySelector('input[name="product-size"]');
    label.classList.toggle("is-selected", input?.checked === true);
  });

  const quantity = getQuantity();
  const lineTotal = selectedProduct.price * quantity;

  if (productPrice) {
    productPrice.textContent = `₹${selectedProduct.price}`;
  }

  if (selectedSize) {
    selectedSize.textContent = `${selectedProduct.size} · ₹${selectedProduct.price} each · Qty ${quantity} · Total ₹${lineTotal}`;
  }

  if (buyButton) {
    const orderMessage = `Hello KeshVeda, I'd like to buy KeshVeda Shampoo:\n${selectedProduct.size} × ${quantity} — ₹${selectedProduct.price} each (Total ₹${lineTotal}).`;
    buyButton.href = `https://wa.me/918793742912?${new URLSearchParams({ text: orderMessage })}`;
  }
};

const updateCart = () => {
  if (!cartSummary || !cartItemsList || !cartCount || !cartTotal) {
    return;
  }

  cartItemsList.replaceChildren();
  let itemCount = 0;
  let total = 0;

  cart.forEach((item, size) => {
    itemCount += item.quantity;
    const lineTotal = item.price * item.quantity;
    total += lineTotal;

    const row = document.createElement("li");
    row.className = "cart-item";

    const details = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = `KeshVeda Shampoo · ${size}`;
    details.append(name, document.createTextNode(` · Qty ${item.quantity} · ₹${lineTotal}`));

    const removeButton = document.createElement("button");
    removeButton.className = "cart-remove";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${size} KeshVeda Shampoo from cart`);
    removeButton.addEventListener("click", () => {
      cart.delete(size);
      updateCart();
    });

    row.append(details, removeButton);
    cartItemsList.append(row);
  });

  cartCount.textContent = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
  cartTotal.textContent = `Total ₹${total}`;
  cartSummary.hidden = cart.size === 0;
};

const getGoogleMapsUrl = (value) => {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isGoogleDomain =
      /(^|\.)google\.(?:com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(hostname);
    const isGoogleMaps =
      hostname === "maps.app.goo.gl" ||
      (hostname === "goo.gl" && url.pathname.startsWith("/maps")) ||
      (isGoogleDomain &&
        (hostname.startsWith("maps.") || url.pathname.includes("/maps")));

    return url.protocol === "https:" && isGoogleMaps ? url.href : null;
  } catch {
    return null;
  }
};

const validateMapsLink = () => {
  if (!locationInput) {
    return null;
  }

  const value = locationInput.value.trim();
  const mapsUrl = getGoogleMapsUrl(value);
  locationInput.setCustomValidity(
    value && !mapsUrl ? "Enter a valid Google Maps share link, or use the location button." : "",
  );
  return mapsUrl;
};

const setLocationStatus = (message, state) => {
  if (locationStatus) {
    locationStatus.textContent = message;
    locationStatus.dataset.state = state;
  }
};

const openOrderDialog = (source) => {
  if (!orderDialog || !orderForm) {
    return;
  }

  if (source === "cart" && cart.size > 0) {
    pendingOrder = [...cart].map(([size, item]) => ({
      size,
      price: item.price,
      quantity: item.quantity,
    }));
  } else {
    const product = getSelectedProduct();
    if (!product) {
      return;
    }
    pendingOrder = [{ ...product, quantity: getQuantity() }];
  }

  orderForm.reset();
  locationInput?.setCustomValidity("");
  setLocationStatus(
    "Share your current location or paste a Google Maps link. Your location is requested only when you tap the button.",
    "",
  );
  orderDialog.showModal();
};

const buildOrderMessage = (mapsUrl) => {
  const customerName = document.querySelector("#customer-name")?.value.trim() ?? "";
  const customerEmail = document.querySelector("#customer-email")?.value.trim() ?? "";
  const deliveryAddress = document.querySelector("#delivery-address")?.value.trim().replace(/\s+/g, " ") ?? "";
  const total = pendingOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const quantityDetails = pendingOrder.map((item) => `${item.quantity} × ${item.size}`).join(" + ");
  const priceDetails = pendingOrder
    .map((item) => `₹${item.price} each${item.quantity > 1 ? ` (× ${item.quantity})` : ""}`)
    .join("; ");

  return [
    "🌿 *KeshVeda — New Order Request*",
    "",
    "Hello KeshVeda Team,",
    "",
    "I would like to place an order for your herbal shampoo. Please find my details below:",
    "",
    "👤 *Customer Details*",
    `• Full Name: ${customerName}`,
    `• Email Address: ${customerEmail}`,
    `• Delivery Address: ${deliveryAddress}`,
    `📍 *Google Maps Location*: ${mapsUrl}`,
    "",
    "🛍️ *Order Details*",
    "• Product: KeshVeda Herbal Shampoo",
    `• Quantity: ${quantityDetails}`,
    `• Price: ${priceDetails}`,
    `• *Total Amount: ₹${total}*`,
    "",
    "Kindly confirm the availability of the product and share the payment and delivery details.",
    "",
    "Thank you!",
    "Looking forward to shopping with KeshVeda. 🌿🤎",
  ].join("\n");
};

document.querySelectorAll(".order-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    if (trigger.closest("#site-nav")) {
      closeMenu();
    }
    openOrderDialog(trigger === cartWhatsapp ? "cart" : "product");
  });
});

document.querySelector(".order-dialog-close")?.addEventListener("click", () => {
  orderDialog?.close();
});

document.querySelector(".order-cancel")?.addEventListener("click", () => {
  orderDialog?.close();
});

orderDialog?.addEventListener("click", (event) => {
  if (event.target === orderDialog) {
    orderDialog.close();
  }
});

locationInput?.addEventListener("input", validateMapsLink);

locationButton?.addEventListener("click", () => {
  if (!locationInput || !locationButton) {
    return;
  }

  if (!window.isSecureContext) {
    setLocationStatus(
      "Location access needs a secure page (HTTPS or localhost). You can paste a Google Maps share link instead.",
      "error",
    );
    return;
  }

  if (!navigator.geolocation) {
    setLocationStatus(
      "This browser does not support location access. You can paste a Google Maps share link instead.",
      "error",
    );
    return;
  }

  locationButton.disabled = true;
  setLocationStatus("Requesting your location… approve the browser prompt to continue.", "");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      locationInput.value = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      validateMapsLink();
      setLocationStatus(
        "Google Maps location added to your order. You can review or replace the link above.",
        "success",
      );
      locationButton.disabled = false;
    },
    (error) => {
      const message =
        error.code === error.PERMISSION_DENIED
          ? "Location permission was not granted. You can paste a Google Maps share link instead."
          : error.code === error.POSITION_UNAVAILABLE
            ? "Your current location is unavailable. You can paste a Google Maps share link instead."
            : "Location request timed out. Try again or paste a Google Maps share link instead.";
      setLocationStatus(message, "error");
      locationButton.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
});

orderForm?.addEventListener("submit", (event) => {
  const mapsUrl = validateMapsLink();
  if (!mapsUrl || pendingOrder.length === 0 || !orderFormText) {
    event.preventDefault();
    if (!mapsUrl) {
      locationInput?.reportValidity();
    }
    return;
  }

  orderFormText.value = buildOrderMessage(mapsUrl);
  orderDialog?.close();
});

sizeOptions.forEach((option) => {
  option.addEventListener("change", updateProductSelection);
});

quantityInput?.addEventListener("input", updateProductSelection);
quantityInput?.addEventListener("change", () => {
  quantityInput.value = String(getQuantity());
  updateProductSelection();
});

document.querySelector(".quantity-decrease")?.addEventListener("click", () => {
  if (quantityInput) {
    quantityInput.value = String(Math.max(1, getQuantity() - 1));
    updateProductSelection();
  }
});

document.querySelector(".quantity-increase")?.addEventListener("click", () => {
  if (quantityInput && getQuantity() < Number.MAX_SAFE_INTEGER) {
    quantityInput.value = String(getQuantity() + 1);
    updateProductSelection();
  }
});

addToCartButton?.addEventListener("click", () => {
  const selectedProduct = getSelectedProduct();
  if (!selectedProduct) {
    return;
  }

  const item = cart.get(selectedProduct.size);
  if (item) {
    item.quantity += getQuantity();
  } else {
    cart.set(selectedProduct.size, {
      price: selectedProduct.price,
      quantity: getQuantity(),
    });
  }

  updateCart();
});

updateProductSelection();
