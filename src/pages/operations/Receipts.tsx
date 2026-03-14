import { OperationsList } from "../../components/operations/OperationsList";

export function Receipts() {
  return (
    <OperationsList
      opType="RECEIPT"
      title="Receipts"
      description="Manage incoming goods from suppliers. Validate to update stock."
      showSupplier={true}
      showSourceLocation={false}
      showDestLocation={true}
    />
  );
}
