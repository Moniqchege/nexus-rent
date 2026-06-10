export default function Footer() {
  return (
    <footer>
      <p
        style={{
          marginTop: "4px",
          fontSize: "12px",
        }}
      >
        © {new Date().getFullYear()} Nexus Rent. All rights reserved.
      </p>
    </footer>
  );
}
