import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [boatName, setBoatName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookings, setBookings] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchBookings();
  }, [session]);

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Account created! Now log in.");
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setBookings([]);
  }

  async function fetchBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setBookings(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from("bookings")
        .update({
          boat_name: boatName,
          customer_name: customerName,
          booking_date: bookingDate,
        })
        .eq("id", editingId);

      if (error) {
        alert(error.message);
        return;
      }

      setEditingId(null);
    } else {
      const { error } = await supabase.from("bookings").insert([
        {
          boat_name: boatName,
          customer_name: customerName,
          booking_date: bookingDate,
          user_id: session.user.id,
        },
      ]);

      if (error) {
        alert(error.message);
        return;
      }
    }

    setBoatName("");
    setCustomerName("");
    setBookingDate("");

    fetchBookings();
  }

  function startEdit(booking) {
    setEditingId(booking.id);
    setBoatName(booking.boat_name);
    setCustomerName(booking.customer_name);
    setBookingDate(booking.booking_date);
  }

  async function deleteBooking(id) {
    const confirmDelete = window.confirm("Delete this booking?");

    if (!confirmDelete) return;

    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchBookings();
  }

  function cancelEdit() {
    setEditingId(null);
    setBoatName("");
    setCustomerName("");
    setBookingDate("");
  }

  if (!session) {
    return (
      <div style={styles.center}>
        <h2>🔐 Marina Login</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={signIn} style={styles.button}>
          Login
        </button>

        <button onClick={signUp} style={styles.secondaryButton}>
          Sign Up
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <button onClick={signOut} style={styles.logout}>
        Logout
      </button>

      <div style={styles.card}>
        <h1>🚤 Marina Booking System</h1>
        <p>Logged in as: {session.user.email}</p>

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Boat Name"
            value={boatName}
            onChange={(e) => setBoatName(e.target.value)}
            style={styles.input}
            required
          />

          <input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={styles.input}
            required
          />

          <input
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            style={styles.input}
            required
          />

          <button style={styles.button}>
            {editingId ? "Update Booking" : "Add Booking"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              style={styles.cancelButton}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div style={styles.card}>
        <h2>📋 Your Bookings</h2>

        {bookings.length === 0 ? (
          <p>No bookings yet.</p>
        ) : (
          bookings.map((b) => (
            <div key={b.id} style={styles.booking}>
              <div>
                <strong>{b.boat_name}</strong>
                <p>
                  👤 {b.customer_name}
                  <br />
                  📅 {b.booking_date}
                </p>
              </div>

              <div>
                <button onClick={() => startEdit(b)} style={styles.editButton}>
                  Edit
                </button>

                <button
                  onClick={() => deleteBooking(b.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#eef6ff",
    padding: "40px",
    fontFamily: "Arial",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "100px",
    fontFamily: "Arial",
  },
  card: {
    maxWidth: "700px",
    margin: "0 auto 25px",
    background: "white",
    padding: "25px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  },
  input: {
    display: "block",
    padding: "12px",
    margin: "10px 0",
    width: "100%",
    maxWidth: "400px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 16px",
    marginRight: "8px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 16px",
    marginTop: "8px",
    border: "none",
    borderRadius: "8px",
    background: "#64748b",
    color: "white",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    background: "#94a3b8",
    color: "white",
    cursor: "pointer",
  },
  logout: {
    position: "absolute",
    top: "20px",
    right: "20px",
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#111827",
    color: "white",
    cursor: "pointer",
  },
  booking: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "12px",
    padding: "15px",
    background: "#f8fafc",
    borderRadius: "12px",
  },
  editButton: {
    marginRight: "8px",
    background: "#facc15",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteButton: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default App;
