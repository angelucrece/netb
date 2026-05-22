-- Ajoute le paiement par carte bancaire aux modes de paiement acceptes.

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_mode_check;

ALTER TABLE payments
ADD CONSTRAINT payments_mode_check
CHECK (mode IN ('cash','orange_money','mtn_money','card','bank_transfer','cheque','credit'));
