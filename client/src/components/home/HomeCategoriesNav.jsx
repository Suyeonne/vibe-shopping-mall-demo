import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../../utils/categories'

function HomeCategoriesNav({ onSelect }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="home-cat-menu" ref={menuRef}>
      <button
        type="button"
        className="home-nav-accent"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        CATEGORIES
      </button>
      {open && (
        <div className="home-cat-dropdown">
          {CATEGORIES.map((item) =>
            onSelect ? (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.id)
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            ) : (
              <Link key={item.id} to={`/${item.id}`} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  )
}

export default HomeCategoriesNav
