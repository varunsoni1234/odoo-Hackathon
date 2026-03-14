import { OperationsList } from "../../components/operations/OperationsList";

export function InternalTransfers() {
  return (
    <OperationsList
      opType="INTERNAL"
      title="Internal Transfers"
      description="Move stock between warehouses or locations within your company."
      showSupplier={false}
      showSourceLocation={true}
      showDestLocation={true}
    />
  );
}
