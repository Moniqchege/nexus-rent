export default function Footer() {
  return (
    <footer>
      <p
        style={{
          marginTop: "4px",
          fontSize: "11px",
          opacity: 0.5,
        }}
      >
        © {new Date().getFullYear()} Nexus Rent. All rights reserved.
      </p>
    </footer>
  );
}