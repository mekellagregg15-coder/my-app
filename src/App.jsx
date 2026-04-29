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
    if (!window.confirm("Delete this booking?")) return;

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
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <div style={styles.logo}>⚓</div>
          <h1 style={styles.loginTitle}>Marina Management</h1>
          <p style={styles.loginSubtitle}>Sign in to manage your bookings</p>

          <input
            placeholder="Email address"
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

          <button onClick={signIn} style={styles.primaryButton}>
            Login
          </button>

          <button onClick={signUp} style={styles.secondaryButton}>
            Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div>
          <h2 style={styles.brand}>⚓ Marina</h2>
          <p style={styles.sidebarText}>Booking Dashboard</p>
        </div>

        <button onClick={signOut} style={styles.logoutButton}>
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Marina Booking System</h1>
            <p style={styles.subtitle}>Welcome, {session.user.email}</p>
          </div>

          <div style={styles.statCard}>
            <span style={styles.statNumber}>{bookings.length}</span>
            <span style={styles.statLabel}>Total Bookings</span>
          </div>
        </header>

        <section style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              {editingId ? "Edit Booking" : "Add New Booking"}
            </h2>

            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Boat Name</label>
              <input
                placeholder="Example: Sea Breeze"
                value={boatName}
                onChange={(e) => setBoatName(e.target.value)}
                style={styles.input}
                required
              />

              <label style={styles.label}>Customer Name</label>
              <input
                placeholder="Example: John Smith"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={styles.input}
                required
              />

              <label style={styles.label}>Booking Date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                style={styles.input}
                required
              />

              <button style={styles.primaryButton}>
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
            <h2 style={styles.cardTitle}>Your Bookings</h2>

            {bookings.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No bookings yet.</p>
                <span>Add your first booking to get started.</span>
              </div>
            ) : (
              <div style={styles.bookingList}>
                {bookings.map((b) => (
                  <div key={b.id} style={styles.bookingCard}>
                    <div>
                      <h3 style={styles.bookingTitle}>{b.boat_name}</h3>
                      <p style={styles.bookingInfo}>👤 {b.customer_name}</p>
                      <p style={styles.bookingInfo}>📅 {b.booking_date}</p>
                    </div>

                    <div style={styles.actions}>
                      <button
                        onClick={() => startEdit(b)}
                        style={styles.editButton}
                      >
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
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f1f5f9",
    fontFamily: "Arial, sans-serif",
    color: "#0f172a",
  },
  sidebar: {
    width: "240px",
    background: "#0f172a",
    color: "white",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  brand: {
    margin: 0,
    fontSize: "26px",
  },
  sidebarText: {
    color: "#94a3b8",
    marginTop: "8px",
  },
  main: {
    flex: 1,
    padding: "36px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
  },
  subtitle: {
    color: "#64748b",
    marginTop: "8px",
  },
  statCard: {
    background: "white",
    padding: "20px 28px",
    borderRadius: "18px",
    boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
    textAlign: "center",
  },
  statNumber: {
    display: "block",
    fontSize: "32px",
    fontWeight: "bold",
    color: "#2563eb",
  },
  statLabel: {
    color: "#64748b",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: "24px",
  },
  card: {
    background: "white",
    padding: "26px",
    borderRadius: "20px",
    boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: "bold",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "13px",
    marginBottom: "16px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  primaryButton: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
    marginTop: "4px",
  },
  secondaryButton: {
    width: "100%",
    padding: "13px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "white",
    color: "#0f172a",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
    marginTop: "10px",
  },
  cancelButton: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "10px",
    background: "#94a3b8",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
    marginTop: "10px",
  },
  logoutButton: {
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  bookingList: {
    display: "grid",
    gap: "14px",
  },
  bookingCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingTitle: {
    margin: "0 0 8px",
  },
  bookingInfo: {
    margin: "4px 0",
    color: "#475569",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  editButton: {
    padding: "9px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#facc15",
    cursor: "pointer",
    fontWeight: "bold",
  },
  deleteButton: {
    padding: "9px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  emptyState: {
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    padding: "28px",
    borderRadius: "16px",
    textAlign: "center",
    color: "#64748b",
  },
  loginPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },
  loginCard: {
    width: "380px",
    background: "white",
    padding: "34px",
    borderRadius: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
    textAlign: "center",
  },
  logo: {
    fontSize: "42px",
    marginBottom: "10px",
  },
  loginTitle: {
    margin: 0,
  },
  loginSubtitle: {
    color: "#64748b",
    marginBottom: "24px",
  },
};

export default App;
