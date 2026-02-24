export type KioskRow = {
  timestamp: string;
  fullName: string;
  phone: string;
  ref: string; // order number
  status: string;
  type: string;
};

export type DuplicateGroup = {
  key: string; // order number
  count: number;
  sample: KioskRow[];
};