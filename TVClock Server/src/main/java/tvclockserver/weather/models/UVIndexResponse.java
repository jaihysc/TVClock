package tvclockserver.weather.models;

public class UVIndexResponse {
    private double lat;
    private double lon;
    private String dateISO;
    private long date;
    private double value;

    public double getLat() { return lat; }
    public void setLat(double value) { this.lat = value; }

    public double getLon() { return lon; }
    public void setLon(double value) { this.lon = value; }

    public String getDateISO() { return dateISO; }
    public void setDateISO(String value) { this.dateISO = value; }

    public long getDate() { return date; }
    public void setDate(long value) { this.date = value; }

    public double getValue() { return value; }
    public void setValue(double value) { this.value = value; }
}
