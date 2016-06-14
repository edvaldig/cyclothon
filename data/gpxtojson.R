library(XML)
library(dplyr)


xml.file <- "wow-cyclothon-2016.gpx"
earth.radius <- 6371e3

gpx_to_df <- function(gpx.file) {
  pfile <- htmlTreeParse(xml.file,
                        error = function (...) {}, useInternalNodes = T)

  
  elevations <- as.numeric(xpathSApply(pfile, path = "//trkpt/ele", xmlValue))
  coords <- xpathSApply(pfile, path = "//trkpt", xmlAttrs)
  
  lats <- as.numeric(coords["lat",])
  lons <- as.numeric(coords["lon",])
  
  data.frame(lat = lats, lon = lons, ele = elevations)
}

get_distances <- function(x,y,z) {
    cartesian <- cbind(x,y,z)
    m <- as.matrix(dist(cartesian, method = "euclidean"))
    
    c(0,diag(m[-1,-ncol(m)] ))
}


gpx_to_df(xml.file) %>%
  mutate(R=earth.radius+ele,
         latr=lat*pi/180,
         lonr=lon*pi/180,
         x=R*cos(latr)*cos(lonr),
         y=R*cos(latr)*sin(lonr),
         z=R*sin(latr),
         distkm=get_distances(x,y,z)/1e3) %>%  
  mutate(distkm.total=cumsum(distkm), 
         pct=distkm.total/last(distkm.total),
         distkm.total.fixed=1358*pct ) %>%
  tbl_df -> map.data 

map.data %>%
  ggplot(aes(lon,lat)) +
  geom_path() +
  coord_map()

map.data %>%
  select(latitude=lat, 
         longitude=lon, 
         elevation=ele, 
         distkm, 
         distkmTotal=distkm.total, 
         distkmTotalFixed=distkm.total.fixed, 
         pct) %>%
  write.csv("map.csv", row.names=F)

