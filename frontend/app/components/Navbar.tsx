export default function Navbar() {
  return (
    <>
<nav>
  <div className="logo">NEXUS RENT</div>
  <div className="nav-search">
    <span className="search-icon">⌕</span>
    <input type="text" placeholder="Search properties, areas, or amenities..."/>
<span
  style={{
    color: "var(--neon-purple)",
    cursor: "pointer",
    fontSize: "14px",
  }}
>
  ⊞ 
</span>  
</div>
  <div className="nav-actions">
    <button className="btn-primary">Sign In</button>
    <button className="btn-purple">List Property</button>
  </div>
</nav>
</>
  )
}