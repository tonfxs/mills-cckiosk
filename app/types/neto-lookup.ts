// // app/admin/neto-lookup/types.ts
// export type OrderResult = {
//   orderId: string | null;
//   status: string;
//   datePlaced: string | null;
//   shippingOption: string | null;
//   deliveryInstruction: string | null;
//   match: { nameMatch: boolean; phoneMatch: boolean };
//   items: Array<{ name: string; qty: number }>;
// };

// export type RmaResult = {
//   rmaId: string;
//   orderId: string | null;
//   invoiceNumber: string | null;
//   status: string;
//   dateIssued: string | null;
//   dateUpdated: string | null;
//   customerUsername: string | null;
//   lines: Array<{ name: string; qty: number }>;
// };

// export type Tab = "pickup" | "rma" | "parts";

export type NetoOrderSummary = {
  orderNumber: string;
  purchaseOrderNumber?: string;
  firstName: string;
  lastName: string;
  paymentMethod: string;
  phoneNumber?: string;
  orderStatus?: string;
  datePlaced?: string;
};

export type LookupResponse = {
  customerName: string;
  orders: NetoOrderSummary[];
};

 export type OrderResult = {
  orderId: string | null;
  status: string;
  datePlaced: string | null;
  shippingOption: string | null;
  deliveryInstruction: string | null;
  match: { nameMatch: boolean; phoneMatch: boolean };
  items: Array<{ name: string; qty: number }>;
};