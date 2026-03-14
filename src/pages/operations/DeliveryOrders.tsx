import { OperationsList } from "../../components/operations/OperationsList";

export function DeliveryOrders() {
  return (
    <OperationsList
      opType="DELIVERY"
      title="Delivery Orders"
      description="Manage outgoing shipments to customers. Validate to reduce stock."
      showSupplier={false}
      showSourceLocation={true}
      showDestLocation={true}
    />
  );
}
