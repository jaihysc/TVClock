package weather.models;

public class MainClass {
    private double temp;
    private double tempMin;
    private double tempMax;
    private double pressure;
    private double seaLevel;
    private double grndLevel;
    private long humidity;
    private double tempKf;

    public double getTemp() { return temp; }
    public void setTemp(double value) { this.temp = value; }

    public double getTempMin() { return tempMin; }
    public void setTempMin(double value) { this.tempMin = value; }

    public double getTempMax() { return tempMax; }
    public void setTempMax(double value) { this.tempMax = value; }

    public double getPressure() { return pressure; }
    public void setPressure(double value) { this.pressure = value; }

    public double getSeaLevel() { return seaLevel; }
    public void setSeaLevel(double value) { this.seaLevel = value; }

    public double getGrndLevel() { return grndLevel; }
    public void setGrndLevel(double value) { this.grndLevel = value; }

    public long getHumidity() { return humidity; }
    public void setHumidity(long value) { this.humidity = value; }

    public double getTempKf() { return tempKf; }
    public void setTempKf(double value) { this.tempKf = value; }
}
