export type MasterRow = {
  timestamp: string;
  fullName: string;
  phone: string;
  orderID: string;
  rmaID: string;
  carParkBay: string;
  status: string;
  agent: string;
  type: string; // "pickup product" | "return product"
};