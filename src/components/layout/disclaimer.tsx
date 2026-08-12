export default function Disclaimer() {
  return (
    <div className="text-center text-underline items-center font-axis-navbar-focus uppercase text-fantas-50/80 tracking-wider">
      This website is part of the initiative for open government by{' '}
      <a
        className="relative text-fantas-900/80 bg-fantas-100/90 px-1 py-0.5 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-fantas-900/80 after:transition-transform after:duration-300 hover:after:scale-x-100"
        href="https://bettergov.ph/"
      >
        Bettergov.ph
      </a> and is not
      affiliated with the local government of Infanta.
    </div>
  );
}
