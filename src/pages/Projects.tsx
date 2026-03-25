import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'
import { ScrollVelocity } from '../components/ScrollVelocity'

const PROJECTS_MARQUEE = 'Your projects · '

export function Projects() {
  const scrollRef = useRef<HTMLDivElement>(null)

  function showNewProjectModal() {
    const name = window.prompt('Project name (e.g. "McKinsey Interview 2026"):')
    if (name) {
      window.alert(
        `Project "${name}" created!\n\nIn production this would open a project setup form with: name, description, date of real presentation, and audience context.`,
      )
    }
  }

  return (
    <PageMotion className="page page--app">
      <div ref={scrollRef} className="projects-page-scroll">
        <section className="projects-header" aria-label="Your projects">
          <div className="projects-scroll-marquee" aria-hidden>
            <ScrollVelocity
              scrollContainerRef={scrollRef}
              texts={[PROJECTS_MARQUEE, PROJECTS_MARQUEE]}
              velocity={72}
              numCopies={8}
              className="projects-scroll-name"
              parallaxClassName="projects-scroll-parallax"
              scrollerClassName="projects-scroll-scroller"
            />
          </div>
          <div className="projects-header-row">
            <p className="projects-header-lede">
              Organise your practice sessions into folders. Each project is one presentation, pitch, or talk.
            </p>
            <button type="button" className="btn-primary btn-sm" onClick={showNewProjectModal}>
              + New project
            </button>
          </div>
        </section>

        <div className="projects-grid">
        <button type="button" className="project-card new-proj" onClick={showNewProjectModal}>
          <div className="new-proj-inner">
            <div className="new-proj-plus">+</div>
            <p className="new-proj-lbl">Create new project</p>
          </div>
        </button>

        <Link to="/app/projects/detail" className="project-card">
          <div className="project-card-top">
            <div className="project-card-icon">📊</div>
            <h3>Series A VC Pitch</h3>
            <p className="proj-desc">Pitching to sceptical investors. €2M target, 15-minute slot. Multiple practice runs before the real thing.</p>
            <div className="project-card-badges">
              <span className="badge orange">Critical stakes</span>
              <span className="badge">4 sessions</span>
            </div>
          </div>
          <div className="project-card-bottom">
            <span className="proj-meta">Last session 2 days ago</span>
            <span className="proj-score mid">Best: 74</span>
          </div>
        </Link>

        <div className="project-card">
          <div className="project-card-top">
            <div className="project-card-icon">🎓</div>
            <h3>MBA Thesis Defence</h3>
            <p className="proj-desc">Defending in front of supervisor + 2 external examiners. 45-minute defence with Q&A.</p>
            <div className="project-card-badges">
              <span className="badge red">Upcoming</span>
              <span className="badge">2 sessions</span>
            </div>
          </div>
          <div className="project-card-bottom">
            <span className="proj-meta">Last session 6 days ago</span>
            <span className="proj-score mid">Best: 58</span>
          </div>
        </div>

        <div className="project-card">
          <div className="project-card-top">
            <div className="project-card-icon">💼</div>
            <h3>McKinsey Interview</h3>
            <p className="proj-desc">Final round case presentation to 2 partners. Structured problem-solving with 20-minute Q&A.</p>
            <div className="project-card-badges">
              <span className="badge green">Completed</span>
              <span className="badge">1 session</span>
            </div>
          </div>
          <div className="project-card-bottom">
            <span className="proj-meta">12 days ago</span>
            <span className="proj-score mid">Best: 61</span>
          </div>
        </div>
      </div>
      </div>
    </PageMotion>
  )
}
