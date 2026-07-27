export async function notifySellerPaymentReceived(opts: {
  sellerName: string;
  sellerEmail: string;
  buyerName: string;
  buyerPhone: string;
  itemName: string;
  amount: number;
  dealCode: string;
  dashboardUrl: string;
}) {
  console.log(`[NOTIFY EMAIL -> SELLER] To: ${opts.sellerEmail}`);
  console.log(`Subject: Payment Locked for "${opts.itemName}" (GH₵ ${opts.amount})`);
  console.log(`Hi ${opts.sellerName}, ${opts.buyerName} (${opts.buyerPhone}) has paid GH₵ ${opts.amount} into SETTLE escrow.`);
  console.log(`View deal dashboard: ${opts.dashboardUrl}`);
}

export async function notifyBuyerDeliveryCode(opts: {
  buyerName: string;
  buyerEmail: string;
  itemName: string;
  sellerName: string;
  deliveryCode: string;
  confirmUrl: string;
}) {
  console.log(`[NOTIFY EMAIL -> BUYER] To: ${opts.buyerEmail}`);
  console.log(`Subject: Your Delivery Confirmation Code for "${opts.itemName}"`);
  console.log(`Hi ${opts.buyerName}, your payment is locked safely in escrow with ${opts.sellerName}.`);
  console.log(`Your 4-digit confirmation code is: ${opts.deliveryCode}`);
  console.log(`Only share this code after receiving your item, or confirm online: ${opts.confirmUrl}`);
}
