import { Link } from 'react-router-dom'
import CartIcon from '../components/home/CartIcon'
import HomeAccount from '../components/home/HomeAccount'
import HomeCategoriesNav from '../components/home/HomeCategoriesNav'
import { useAuthUser } from '../hooks/useAuthUser'
import './HomeMain.css'

function About() {
  const { user, loading: authLoading, isAdmin, logout } = useAuthUser()

  return (
    <div className="home">
      <div className="home-ticker">
        <div className="home-ticker-track">
          {Array.from({ length: 24 }).map((_, index) => (
            <span key={index}>NEW COLLECTION</span>
          ))}
        </div>
      </div>

      <header className="home-top">
        <nav className="home-nav">
          <HomeCategoriesNav />
          <Link to="/new-collection">NEW COLLECTION</Link>
          <Link to="/about">ABOUT</Link>
        </nav>
        <div className="home-brand-side">
          <HomeAccount user={user} loading={authLoading} isAdmin={isAdmin} logout={logout} />
          <CartIcon />
        </div>
      </header>

      <Link to="/" className="home-title-wrap">
        <span className="home-star" aria-hidden="true">
          ✦
        </span>
        <h1 className="home-title">
          <img src="/still-tired-title.png" alt="STILL TIRED" />
        </h1>
      </Link>

      <main className="home-about">
        <div className="home-about-inner">
          <h2>STILL TIRED, STILL GOING.</h2>
          <p>STILL TIRED는 늘 완벽할 필요는 없다는 생각에서 시작되었습니다.</p>
          <p>
            조금 느린 날도, 아무것도 하기 싫은 날도, 계획대로 되지 않는 순간도 자연스러운 일상의 일부라고
            생각합니다.
          </p>
          <p>
            우리는 완벽함보다는 각자의 방식과 리듬을 존중합니다.
            <br />
            지쳐 있어도 멈춘 것은 아니니까요.
          </p>
        </div>
      </main>

      <footer className="home-footer">© ALL RIGHTS RESERVED</footer>
    </div>
  )
}

export default About
