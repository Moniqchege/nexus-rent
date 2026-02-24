export default function Footer() {
  return (
    <footer>
      <div className="footer-logo">NEXUS RENT</div>

      <p>
        Discover rental properties with intelligent search, real-time insights,
        and a seamless browsing experience.
      </p>

      <p
        style={{
          marginTop: "8px",
          fontSize: "11px",
          opacity: 0.5,
        }}
      >
        © {new Date().getFullYear()} Nexus Rent. All rights reserved.
      </p>
    </footer>
  );
}