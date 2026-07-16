export type OrderStatus = "pending" | "out_for_delivery" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  image: string;
}

export interface Order {
  id: string; // e.g. RM-2398
  date: string; // e.g. Wednesday 8 July
  status: OrderStatus;
  items: OrderItem[];
  totalPrice: number;
  currency: string;
  isFavorite?: boolean;
}

export const MOCK_ORDERS: Order[] = [
  {
    id: "RM-2398",
    date: "Wednesday 8 July",
    status: "delivered",
    totalPrice: 245,
    currency: "EGP",
    isFavorite: false,
    items: [
      {
        id: "butter-croissant",
        title: "Butter Croissant Box",
        quantity: 1,
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "cinnamon-rolls",
        title: "Glazed Cinnamon Rolls",
        quantity: 1,
        image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "RM-5412",
    date: "Thursday 9 July",
    status: "out_for_delivery",
    totalPrice: 170,
    currency: "EGP",
    isFavorite: true,
    items: [
      {
        id: "feteer-meshaltet",
        title: "Feteer Meshaltet",
        quantity: 2,
        image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "RM-8921",
    date: "Today, 14:20",
    status: "pending",
    totalPrice: 110,
    currency: "EGP",
    isFavorite: false,
    items: [
      {
        id: "baladi-bread",
        title: "Baladi Bread",
        quantity: 4,
        image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "kahk-cookies",
        title: "Kahk Eid Cookies Box",
        quantity: 1,
        image: "https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "RM-1043",
    date: "Monday 6 July",
    status: "cancelled",
    totalPrice: 95,
    currency: "EGP",
    isFavorite: false,
    items: [
      {
        id: "sourdough-loaf",
        title: "Artisanal Sourdough Loaf",
        quantity: 1,
        image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];
