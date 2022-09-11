import Footer from "./Footer";
import Header from "./Header";

type LayoutProps = {
  hideHeader?: boolean;
  hideFooter?: boolean;
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({
  hideHeader,
  hideFooter,
  children,
}) => {
  return (
    <>
      {hideHeader !== true && <Header />}
      <main>{children}</main>
      {hideFooter !== true && <Footer />}
    </>
  );
};

export default Layout;
