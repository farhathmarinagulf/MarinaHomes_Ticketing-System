export default function Brand({href='/dashboard'}:{href?:string}) {
  return <a className="brand marina-brand" href={href} aria-label="Marina Home staff helpdesk">
    <span className="brand-mark" role="img" aria-label="Marina Home" />
    <small>STAFF HELPDESK</small>
  </a>;
}
