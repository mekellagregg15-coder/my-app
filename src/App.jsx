import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

function App() {
  const [session, setSession] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [boatName, setBoatName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [price, setPrice] = useState("");

  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("user");

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session),
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchBookings();
      fetchProfile();
    }
  }, [session]);

  async function fetchProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (data) setRole(data.role);
  }

  async function fetchUsers() {
    const { data, error } = await supabase.from("profiles").select("*");

    if (error) return alert(error.message);
    setUsers(data || []);
  }

  async function fetchAllBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("id", { ascending: false });

    if (error) return alert(error.message);
    setAllBookings(data || []);
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Account created. Now log in.");
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
    setAllBookings([]);
    setUsers([]);
  }

  async function fetchBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("id", { ascending: false });

    if (error) return alert(error.message);
    setBookings(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const booking = {
      boat_name: boatName,
      customer_name: customerName,
      booking_date: bookingDate,
      price: Number(price || 0),
      user_id: session.user.id,
    };

    const query = editingId
      ? supabase.from("bookings").update(booking).eq("id", editingId)
      : supabase.from("bookings").insert([booking]);

    const { error } = await query;

    if (error) return alert(error.message);

    setBoatName("");
    setCustomerName("");
    setBookingDate("");
    setPrice("");
    setEditingId(null);
    fetchBookings();
  }

  function startEdit(booking) {
    setEditingId(booking.id);
    setBoatName(booking.boat_name);
    setCustomerName(booking.customer_name);
    setBookingDate(booking.booking_date);
    setPrice(booking.price || "");
  }

  async function deleteBooking(id) {
    if (!confirm("Delete this booking?")) return;

    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) return alert(error.message);

    fetchBookings();
    fetchAllBookings();
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const text =
        `${booking.boat_name} ${booking.customer_name} ${booking.booking_date}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [bookings, search]);

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + Number(booking.price || 0),
    0,
  );

  const upcomingBookings = bookings.filter(
    (booking) => new Date(booking.booking_date) >= new Date(),
  ).length;

  const theme = darkMode ? dark : light;

  if (!session) {
    return (
      <div style={{ ...styles.loginPage, background: theme.loginBackground }}>
        <div
          style={{
            ...styles.loginCard,
            background: theme.card,
            color: theme.text,
          }}
        >
          <div style={styles.logo}>⚓</div>
          <h1>Marina Management</h1>
          <p style={{ color: theme.muted }}>Sign in to manage your bookings</p>

          <input
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.primaryButton} onClick={signIn}>
            Login
          </button>

          <button style={styles.secondaryButton} onClick={signUp}>
            Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.page,
        background: theme.background,
        color: theme.text,
      }}
    >
      <aside style={{ ...styles.sidebar, background: theme.sidebar }}>
        <div>
          <h2 style={styles.brand}>⚓ Marina</h2>
          <p style={styles.sidebarText}>Operations Dashboard</p>
          {role === "admin" && <p style={styles.adminBadge}>👑 Admin</p>}
        </div>

        <div>
          <button
            style={styles.darkButton}
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          <button style={styles.logoutButton} onClick={signOut}>
            Logout
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Marina Booking System</h1>
            <p style={{ ...styles.subtitle, color: theme.muted }}>
              Welcome, {session.user.email} {role === "admin" && "👑"}
            </p>
          </div>
        </header>

        <section style={styles.statsGrid}>
          <StatCard
            label="Total Bookings"
            value={bookings.length}
            theme={theme}
          />
          <StatCard label="Upcoming" value={upcomingBookings} theme={theme} />
          <StatCard
            label="Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            theme={theme}
          />
        </section>

        <section style={styles.grid}>
          <div style={{ ...styles.card, background: theme.card }}>
            <h2 style={styles.cardTitle}>
              {editingId ? "Edit Booking" : "Add Booking"}
            </h2>

            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Boat Name</label>
              <input
                style={styles.input}
                placeholder="Example: Sea Breeze"
                value={boatName}
                onChange={(e) => setBoatName(e.target.value)}
                required
              />

              <label style={styles.label}>Customer Name</label>
              <input
                style={styles.input}
                placeholder="Example: John Smith"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />

              <label style={styles.label}>Booking Date</label>
              <input
                style={styles.input}
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />

              <label style={styles.label}>Price</label>
              <input
                style={styles.input}
                type="number"
                placeholder="Example: 250"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

              <button style={styles.primaryButton}>
                {editingId ? "Update Booking" : "Add Booking"}
              </button>
            </form>
          </div>

          <div style={{ ...styles.card, background: theme.card }}>
            <h2 style={styles.cardTitle}>Your Bookings</h2>

            <input
              style={styles.searchInput}
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div style={styles.bookingList}>
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  style={{
                    ...styles.bookingCard,
                    background: theme.booking,
                    borderColor: theme.border,
                  }}
                >
                  <div>
                    <h3 style={styles.bookingTitle}>{booking.boat_name}</h3>
                    <p style={{ ...styles.bookingInfo, color: theme.muted }}>
                      👤 {booking.customer_name}
                    </p>
                    <p style={{ ...styles.bookingInfo, color: theme.muted }}>
                      📅 {booking.booking_date}
                    </p>
                    <p style={{ ...styles.bookingInfo, color: theme.muted }}>
                      💵 ${Number(booking.price || 0).toFixed(2)}
                    </p>
                  </div>

                  <div style={styles.actions}>
                    <button
                      style={styles.editButton}
                      onClick={() => startEdit(booking)}
                    >
                      Edit
                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() => deleteBooking(booking.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {role === "admin" && (
          <section
            style={{
              ...styles.card,
              background: theme.card,
              marginTop: "28px",
            }}
          >
            <h2 style={styles.cardTitle}>📊 Admin Panel</h2>

            <div style={styles.adminButtons}>
              <button style={styles.primaryButton} onClick={fetchUsers}>
                Load Users
              </button>

              <button style={styles.primaryButton} onClick={fetchAllBookings}>
                Load All Bookings
              </button>
            </div>

            <h3>Users</h3>
            {users.map((user) => (
              <div
                key={user.id}
                style={{ ...styles.adminRow, borderColor: theme.border }}
              >
                <strong>{user.email}</strong>
                <span>{user.role}</span>
              </div>
            ))}

            <h3>All Bookings</h3>
            {allBookings.map((booking) => (
              <div
                key={booking.id}
                style={{ ...styles.adminRow, borderColor: theme.border }}
              >
                <span>
                  <strong>{booking.boat_name}</strong> — {booking.customer_name}
                </span>
                <button
                  style={styles.deleteButton}
                  onClick={() => deleteBooking(booking.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, theme }) {
  return (
    <div style={{ ...styles.statCard, background: theme.card }}>
      <span style={styles.statNumber}>{value}</span>
      <span style={{ ...styles.statLabel, color: theme.muted }}>{label}</span>
    </div>
  );
}

const light = {
  background: "linear-gradient(135deg, #eef6ff, #f8fafc)",
  sidebar: "linear-gradient(180deg, #0f172a, #111827)",
  card: "#ffffff",
  booking: "#f8fafc",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  loginBackground: "linear-gradient(135deg, #0f172a, #1d4ed8)",
};

const dark = {
  background: "linear-gradient(135deg, #020617, #0f172a)",
  sidebar: "linear-gradient(180deg, #020617, #111827)",
  card: "#111827",
  booking: "#1e293b",
  text: "#f8fafc",
  muted: "#cbd5e1",
  border: "#334155",
  loginBackground: "linear-gradient(135deg, #020617, #172554)",
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "260px",
    padding: "32px 24px",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
    minHeight: "100vh",
  },
  brand: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800",
  },
  sidebarText: {
    color: "#cbd5e1",
    fontSize: "16px",
  },
  adminBadge: {
    background: "#facc15",
    color: "#111827",
    padding: "8px 12px",
    borderRadius: "999px",
    display: "inline-block",
    fontWeight: "800",
    marginTop: "12px",
  },
  main: {
    flex: 1,
    padding: "44px",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "28px",
  },
  title: {
    fontSize: "42px",
    margin: 0,
    fontWeight: "800",
    letterSpacing: "-1px",
  },
  subtitle: {
    fontSize: "18px",
    marginTop: "8px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
    marginBottom: "28px",
  },
  statCard: {
    padding: "24px",
    borderRadius: "24px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.10)",
  },
  statNumber: {
    display: "block",
    fontSize: "34px",
    fontWeight: "800",
    color: "#2563eb",
  },
  statLabel: {
    fontSize: "15px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 440px) 1fr",
    gap: "28px",
  },
  card: {
    padding: "32px",
    borderRadius: "28px",
    boxShadow: "0 20px 50px rgba(15,23,42,0.10)",
  },
  cardTitle: {
    marginTop: 0,
    fontSize: "28px",
    fontWeight: "800",
  },
  label: {
    display: "block",
    fontWeight: "700",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "15px",
    marginBottom: "18px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  searchInput: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    marginBottom: "20px",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  primaryButton: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "16px",
  },
  secondaryButton: {
    width: "100%",
    padding: "15px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    background: "white",
    color: "#0f172a",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "12px",
  },
  darkButton: {
    width: "100%",
    padding: "13px",
    marginBottom: "12px",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    cursor: "pointer",
    fontWeight: "800",
  },
  logoutButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: "800",
  },
  bookingList: {
    display: "grid",
    gap: "18px",
  },
  bookingCard: {
    border: "1px solid",
    borderRadius: "22px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
  },
  bookingTitle: {
    margin: "0 0 10px",
    fontSize: "24px",
    fontWeight: "800",
  },
  bookingInfo: {
    margin: "6px 0",
    fontSize: "16px",
  },
  actions: {
    display: "flex",
    gap: "10px",
  },
  editButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#facc15",
    cursor: "pointer",
    fontWeight: "800",
  },
  deleteButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: "800",
  },
  adminButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "24px",
  },
  adminRow: {
    border: "1px solid",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
  },
  loginPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },
  loginCard: {
    width: "400px",
    padding: "38px",
    borderRadius: "28px",
    boxShadow: "0 25px 70px rgba(0,0,0,0.28)",
    textAlign: "center",
  },
  logo: {
    fontSize: "46px",
  },
};

export default App;
