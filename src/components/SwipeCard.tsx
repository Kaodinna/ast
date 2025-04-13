import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, X, ExternalLink, Calendar, MapPin, Users, DollarSign, CheckCircle2 } from "lucide-react";
import Link from 'next/link';

export type Opportunity = {
  id: string;
  title: string;
  description: string;
  provider: string;
  creatorType: string;
  type: string;
  deadline?: Date | null;
  location?: string | null;
  eligibility?: string | null;
  funding?: string | null;
  url?: string | null;
  createdAt: Date;
};

interface SwipeCardProps {
  opportunity: Opportunity;
  onSwipe: (direction: 'left' | 'right', opportunity: Opportunity) => void;
  active: boolean;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ opportunity, onSwipe, active }) => {
  const [exitX, setExitX] = useState<number>(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExitX(200);
      onSwipe('right', opportunity);
    } else if (info.offset.x < -100) {
      setExitX(-200);
      onSwipe('left', opportunity);
    }
  };

  const handleLike = () => {
    setExitX(200);
    onSwipe('right', opportunity);
  };

  const handleDislike = () => {
    setExitX(-200);
    onSwipe('left', opportunity);
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        position: 'absolute',
        width: '100%',
        height: '100%',
      }}
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="w-full h-full overflow-hidden flex flex-col bg-gradient-to-br from-background to-muted/50 backdrop-blur-sm border-2">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold line-clamp-2">{opportunity.title}</h3>
              <p className="text-sm text-muted-foreground">{opportunity.provider}</p>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              {opportunity.type}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-auto pb-2">
          <div className="space-y-4">
            <p className="text-sm">{opportunity.description}</p>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              {opportunity.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(opportunity.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {opportunity.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{opportunity.location}</span>
                </div>
              )}
              
              {opportunity.eligibility && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{opportunity.eligibility}</span>
                </div>
              )}
              
              {opportunity.funding && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{opportunity.funding}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t bg-muted/20 pt-3 flex-col gap-2">
          <div className="flex justify-between items-center w-full">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-background/80 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
              onClick={handleDislike}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <Link href={`/dashboard/opportunities/${opportunity.id}`}>
              <Button variant="outline" size="sm" className="rounded-full">
                <ExternalLink className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-background/80 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors"
              onClick={handleLike}
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>
          
          <Link href={`/dashboard/opportunities/${opportunity.id}`} className="w-full">
            <Button className="w-full" size="sm">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Apply Now
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default SwipeCard;