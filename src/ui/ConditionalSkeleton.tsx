import React from "react";
import {Skeleton, Tooltip} from "@mui/material";
import {SkeletonProps} from "@mui/material/Skeleton/Skeleton";

type ConditionalSkeletonProps = {
  /** ok-condition, if false, show a skeleton instead */
  condition: boolean,
  tooltipText?:string,
} & SkeletonProps

export const ConditionalSkeleton: React.FC<ConditionalSkeletonProps> = (props) => {
  if (props.condition) {
    return <>{props.children}</>
  }else{
    return <Tooltip title={props.tooltipText ?? 'Condition not met'}><Skeleton {...props}/></Tooltip>
  }
}
