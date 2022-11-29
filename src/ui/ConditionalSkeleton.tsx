import React, {useCallback, useEffect, useRef, useState} from "react";
import {Backdrop, Box} from "@mui/material";
import {modalStyle} from "./modal/megaModal";

type ConditionalSkeletonProps = {
  /** ok-condition, if false, show a skeleton instead */
  condition: boolean,
  tooltipText?: JSX.Element | string | undefined,
  children: JSX.Element[] | JSX.Element,
}

export const ConditionalSkeleton: React.FC<ConditionalSkeletonProps> = (props) => {
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const ref: React.MutableRefObject<HTMLElement|undefined> = useRef();
  const refresh = useCallback(()=>{
    if (ref.current) {
      setWidth(ref.current.clientWidth)
      setHeight(ref.current.clientHeight)
      setTop(ref.current.offsetTop)
      setLeft(ref.current.offsetLeft)
    }
  },[ref]);
  useEffect(() => {
    refresh()
  }, [ref]);
  return <Box ref={ref} onScroll={refresh}>
    <Backdrop sx={{width, height, zIndex:998}} style={{position: "absolute", top, left}}
              open={!props.condition}>{props.tooltipText && <Box sx={modalStyle}>{props.tooltipText}</Box>}</Backdrop>
    {props.children}
  </Box>
}
