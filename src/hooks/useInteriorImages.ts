import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ConfigState } from "./useConfigurator";

export function useInteriorImages(config: ConfigState): [string, string] | null {
  const [images, setImages] = useState<[string, string] | null>(null);

  useEffect(() => {
    if (config.model !== "start") {
      setImages(null);
      return;
    }

    const fetchImages = async () => {
      let query = supabase
        .from("interior_images")
        .select("image1_url, image2_url")
        .eq("model", config.model)
        .eq("plan", config.floorPlan)
        .eq("finish_level", config.finishLevel);

      if (config.finishLevel === "shell") {
        query = query.is("floor_option", null).is("kast_color", null);
      } else if (config.finishLevel === "finished") {
        query = query.eq("floor_option", config.floorOption).is("kast_color", null);
      } else {
        query = query.eq("floor_option", config.floorOption).eq("kast_color", config.shelfColor);
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data || !data.image1_url || !data.image2_url) {
        setImages(null);
        return;
      }

      setImages([data.image1_url, data.image2_url]);
    };

    fetchImages();
  }, [config.model, config.floorPlan, config.finishLevel, config.floorOption, config.shelfColor]);

  return images;
}
