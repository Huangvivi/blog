import { LinkProps } from "next/link";
import React, { ReactNode } from "react";
import LocaleLink from "./LocaleLink";

interface IProps extends LinkProps {
  children: ReactNode;
}

const NoScrollLink = ({ children, ...restProps }: IProps): JSX.Element => {
  return (
    <LocaleLink {...restProps} scroll={false}>
      {children}
    </LocaleLink>
  );
};

export default NoScrollLink;
