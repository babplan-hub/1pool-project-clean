import { useNavigate } from "react-router-dom";

const HistoryPage = ({ history }: any) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0f19] px-6 py-24">
      <div className="max-w-4xl mx-auto space-y-6">

        {history.length === 0 ? (
          <p>No history yet</p>
        ) : (
          history.map((order: any) => (
            <div key={order.id} className="bg-white/5 p-6 rounded-2xl">
              {order.table && <p>Table: {order.table}</p>}
              {order.slots?.map((slot: string) => (
                <p key={slot}>• {slot}</p>
              ))}
              {order.items?.map((i: any) => (
                <p key={i.id}>
                  {i.name} × {i.qty}
                </p>
              ))}
              <p className="text-blue-400">฿{order.total}</p>
              <p className="text-sm text-white/50">
                {order.method} | {order.date}
              </p>
            </div>
          ))
        )}

        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 px-6 py-3 rounded-xl"
        >
          New Booking
        </button>
      </div>
    </div>
  );
};

export default HistoryPage;