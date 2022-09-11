import Container from "./Container";
import { AUTHOR_NAME } from "../lib/constants";

const Footer = () => {
  return (
    <footer className="bg-primary text-secondary-content">
      <Container>
        <div className="py-16 flex items-center text-xl font-extrabold justify-center">
          <span>
            © {new Date().getFullYear()} {AUTHOR_NAME}. All rights reserved.
          </span>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
