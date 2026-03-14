import { OperationsList } from "../../components/operations/OperationsList";

export function StockAdjustments() {
  return (
    <OperationsList
      opType="ADJUSTMENT"
      title="Stock Adjustments"
      description="Reconcile physical counts with system records. Validate to correct stock levels."
      showSupplier={false}
      showSourceLocation={true}
      showDestLocation={false}
    />
  );
}
