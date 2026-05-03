export type PaymentPurpose = 'Reaction' | 'BoardTipPayment' | 'UserTipPayment'

export interface Transaction {
  id: string
  stripeTransactionId?: string
  paymentPurpose?: PaymentPurpose
  price?: string // creator receives (dollars)
  applicationFee?: string // platform fee (dollars)
  stripeFee?: string // Stripe fee (dollars)
  totalAmount?: string // viewer paid (dollars)
  senderUserId?: string
  receiverUserId?: string
  reactionId?: string
  boardId?: string
  createdAt: string
}

export interface CreateTipIntentRequest {
  featureName: 'ReactionTipPayment' | 'BoardTipPayment' | 'UserTipPayment'
  boardId?: string
  userId?: string
  amount: number // dollars
  paymentMethodId: string
}

export interface CreateTipIntentResponse {
  paymentIntentId: string
  clientSecret: string
}
