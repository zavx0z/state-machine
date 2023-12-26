const xml = String.raw
const machine = xml`
<?xml version="1.0" encoding="UTF-8"?>
<scxml name="MicroWave"
  xmlns="http://www.w3.org/2005/07/scxml" version="1.0" datamodel="ecmascript" initial="off">
  <datamodel >
    <data id="cook_time" expr="5" />
    <data id="door_closed" expr="true" />
    <data id="timer" expr="0" />
  </datamodel>
  <state id="off">
    <transition event="turn.on" target="on" />
  </state>
  <state id="on">
    <initial>
      <transition target="idle" />
    </initial>
    <!-- on/pause state -->
    <transition event="turn.off" target="off" />
    <transition cond="timer &gt;= cook_time" target="off" />

    <state id="idle">
      <!-- default immediate transition if door is shut -->
      <transition cond="door_closed" target="cooking" />
      <transition event="door.close" target="cooking">
        <assign location="door_closed" expr="true" />
        <!-- start cooking -->
      </transition>
    </state>

    <state id="cooking">
      <onentry>
        <script src="entry action"/>
      </onentry>
      <onexit>
        <script src="exit action"/>
      </onexit>
      <invoke src="timerService"/>
      <transition event="door.open" target="idle">
        <assign location="door_closed" expr="false" />
      </transition>

      <!-- a 'time' event is seen once a second -->
      <transition event="time">
        <assign location="timer" expr="timer + 1" />
      </transition>
    </state>
  </state>
</scxml>
`
