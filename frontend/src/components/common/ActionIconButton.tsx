import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Tooltip from "antd/es/tooltip";
import {
  EyeOutlined, EditOutlined, DeleteOutlined, HistoryOutlined,
  SwapOutlined, CalculatorOutlined, ExperimentOutlined,
  CheckOutlined, CloseOutlined, ShopOutlined,
} from "@ant-design/icons";
import "./ActionIconButton.css";

const icons = {
  view: EyeOutlined, edit: EditOutlined, delete: DeleteOutlined,
  history: HistoryOutlined, status: SwapOutlined, score: CalculatorOutlined,
  materials: ExperimentOutlined, approve: CheckOutlined, reject: CloseOutlined,
  supplier: ShopOutlined,
};
type CommonProps = { action: keyof typeof icons; label: string };
type Props = CommonProps & (
  | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: never })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
);

/** Presentation only: callers retain authorization, state and event handling. */
export default function ActionIconButton({ action, label, ...props }: Props) {
  const Icon = icons[action];
  const className = `pm-action-icon pm-action-icon--${action}`;
  return (
    <Tooltip title={label}>
      <span className="pm-action-icon-wrap">
        {typeof props.href === "string" ? (
          <a {...props as AnchorHTMLAttributes<HTMLAnchorElement>} className={className} aria-label={label}>
            <Icon aria-hidden="true" />
          </a>
        ) : (
          <button {...props as ButtonHTMLAttributes<HTMLButtonElement>} type={props.type as "button" | "submit" | "reset" ?? "button"}
            className={className} aria-label={label}>
            <Icon aria-hidden="true" />
          </button>
        )}
      </span>
    </Tooltip>
  );
}
