import { OrderPage } from "@/components/order-page";
export const metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <OrderPage />;
}
